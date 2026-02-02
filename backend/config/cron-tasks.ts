import { Strapi } from '@strapi/strapi';
import moment from 'moment';
import { sendEmail, generateFeedbackEmailHtml, generateFeedbackEmailText } from '../src/utils/email';

export default {
  dailyFeedbackEmail: {
    task: async ({ strapi }: { strapi: Strapi }) => {
      console.log('Running daily feedback email cron task', new Date().toISOString());

      const today = moment().format('YYYY-MM-DD');

      // Get all feedbacks created today with child and center relations
      const feedbacks = await strapi.entityService.findMany('api::feedback.feedback', {
        filters: {
          createdDate: today,
        },
        populate: {
          child: {
            populate: {
              parents: true,
              center: true,
            },
          },
        },
      });

      if (!feedbacks.length) {
        console.log('No feedbacks found for today, skipping email send');
        return;
      }

      console.log(`Found ${feedbacks.length} feedbacks for today`);

      // Group feedbacks by parent email
      const parentFeedbacks: Map<
        string,
        {
          parentName: string;
          email: string;
          feedbacks: Array<{
            childName: string;
            mathScore?: number;
            englishScore?: number;
            mathTime?: string;
            englishTime?: string;
            feedback?: string;
            date: string;
            centerName: string;
          }>;
        }
      > = new Map();

      for (const feedback of feedbacks) {
        const child = feedback.child;
        if (!child) continue;

        const parents = child.parents || [];
        const center = child.center;
        const centerName = center?.displayName || center?.name || 'Kumon Centre';

        for (const parent of parents) {
          if (!parent.email) continue;

          const existingEntry = parentFeedbacks.get(parent.email);
          const feedbackData = {
            childName: `${child.firstName} ${child.lastName || ''}`.trim(),
            mathScore: feedback.mathScore,
            englishScore: feedback.englishScore,
            mathTime: feedback.mathTime,
            englishTime: feedback.englishTime,
            feedback: feedback.feedback,
            date: today,
            centerName,
          };

          if (existingEntry) {
            // Check if we already have feedback for this child (avoid duplicates)
            const existingChild = existingEntry.feedbacks.find((f) => f.childName === feedbackData.childName);
            if (!existingChild) {
              existingEntry.feedbacks.push(feedbackData);
            }
          } else {
            parentFeedbacks.set(parent.email, {
              parentName: `${parent.firstName} ${parent.lastName || ''}`.trim(),
              email: parent.email,
              feedbacks: [feedbackData],
            });
          }
        }
      }

      console.log(`Sending feedback emails to ${parentFeedbacks.size} parents`);

      // Send emails to each parent
      let successCount = 0;
      let failCount = 0;

      for (const [email, data] of parentFeedbacks) {
        const subject = `Daily Learning Update - ${moment().format('MMMM D, YYYY')}`;
        const html = generateFeedbackEmailHtml(data.parentName, data.feedbacks);
        const text = generateFeedbackEmailText(data.parentName, data.feedbacks);

        const success = await sendEmail({
          to: email,
          subject,
          html,
          text,
        });

        if (success) {
          successCount++;
          console.log(`Email sent successfully to ${email}`);
        } else {
          failCount++;
          console.log(`Failed to send email to ${email}`);
        }
      }

      console.log(`Daily feedback email task completed: ${successCount} sent, ${failCount} failed`);
    },
    options: {
      // Run at 6:00 PM every day
      rule: '0 18 * * *',
    },
  },
  trialChecker: {
    task: async ({ strapi }: { strapi: Strapi }) => {
      console.log('Running trial checker cron task');
      const centers = await strapi.entityService.findMany('api::center.center', {
        filters: {
          subscription: {
            status: 'trial',
            trialExpiryDate: {
              $lte: new Date(),
            },
          },
        },
        populate: ['subscription'],
      });

      for (const center of centers) {
        const isInvited = await strapi.entityService.findMany('api::invite-code.invite-code', {
          filters: {
            usedBy: center,
          },
        });

        if (isInvited.length) {
          console.log(`Center ${center.name} trial is expired, setting to free plan`);
          await strapi.entityService.update('api::center.center', center.id, {
            data: {
              subscription: {
                status: 'free',
                freePlanLimit: 50,
              },
            },
          });
        } else {
          console.log(`Center ${center.name} trial is expired, marking as inactive`);
          await strapi.entityService.update('api::center.center', center.id, {
            data: {
              subscription: {
                status: 'inactive',
              },
            },
          });
        }
      }
    },
    options: {
      rule: '0 1 1 * *',
    },
  },
  dueStudents: {
    task: async ({ strapi }: { strapi: Strapi }) => {
      console.log('Running due students cron task', new Date().toISOString());
      const centers = await strapi.entityService.findMany('api::center.center', {
        filters: {
          subscription: {
            status: {
              $ne: 'inactive',
            },
          },
        },
      });

      for (const center of centers) {
        if (center.paymentHandler !== 'inbuilt') {
          continue;
        }
        console.log(`Checking due students for center ${center.name}`);

        const day = new Date().getDate();

        const filters: any = {
          center: center.id,
        };

        const defaultPaymentDate = center.defaultPaymentDate || 1;

        if (day === defaultPaymentDate) {
          filters.$or = [
            {
              paymentDate: {
                $null: true,
              },
            },
            {
              paymentDate: day,
            },
          ];
        } else {
          filters.paymentDate = day;
        }

        const monthFirstDay = moment().startOf('month').format('YYYY-MM-DD');
        const today = moment().format('YYYY-MM-DD');

        const children = await strapi.entityService.findMany('api::child.child', {
          filters,
        });

        for (const child of children) {
          if (child.status === 'Exited') {
            continue;
          }
          const payments = await strapi.entityService.findMany('api::payment.payment', {
            filters: {
              center: center,
              child: child,
              paymentDate: {
                $gte: monthFirstDay,
                $lte: today,
              },
            },
          });

          const currentDueAmount = child.dueAmount || 0;

          // if no payments are made
          if (!payments.length) {
            console.log(`Child ${child.firstName} ${child.lastName} has not paid for the month`);
            await strapi.entityService.update('api::child.child', child.id, {
              data: {
                isDue: true,
                dueAmount: child.paymentAmount ? currentDueAmount + child.paymentAmount : null,
              },
            });
            continue;
          }

          // if child payment amount is not set and payments are made
          if (!child.paymentAmount) {
            if (child.isDue) {
              console.log(`Child ${child.firstName} ${child.lastName} has paid full amount for the month`);
              await strapi.entityService.update('api::child.child', child.id, {
                data: {
                  isDue: false,
                  dueAmount: null,
                },
              });
            }
            continue;
          }

          const totalAmountPaid = payments.reduce((acc, payment) => acc + payment.amount, 0);

          // if partial payments are made
          if (totalAmountPaid < child.paymentAmount) {
            console.log(`Child ${child.firstName} ${child.lastName} has not paid full amount for the month`);
            await strapi.entityService.update('api::child.child', child.id, {
              data: {
                isDue: true,
                dueAmount: currentDueAmount + (child.paymentAmount - totalAmountPaid),
              },
            });
            continue;
          }

          if (currentDueAmount > 0) {
            continue;
          }

          // if full payment is made
          if (child.isDue) {
            console.log(`Child ${child.firstName} ${child.lastName} has paid full amount for the month`);
            await strapi.entityService.update('api::child.child', child.id, {
              data: {
                isDue: false,
                dueAmount: null,
              },
            });
          }
        }
        console.log(`Finished checking due students for center ${center.name}`);
      }
    },
    options: {
      rule: '0 0 2 * * *',
    },
  },
};
