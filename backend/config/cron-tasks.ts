import { Strapi } from '../types';
import moment from 'moment';
import { generateFeedbackEmailHtml, generateFeedbackEmailText } from '../src/utils/email';

const sendFeedbackEmails = async (strapi: Strapi) => {
  console.log('Running feedback email cron task', new Date().toISOString());

  const testModeEmail = process.env.TEST_MODE_FEEDBACK_EMAIL;
  if (testModeEmail) {
    console.log(`Test mode enabled - all emails will be sent to: ${testModeEmail}`);
  }

  // Get feedbacks where isFeedbackCompleted is true and isMailSent is not true
  const feedbacks = await strapi.documents('api::feedback.feedback').findMany({
    filters: {
      isFeedbackCompleted: true,
      isMailSent: {
        $ne: true,
      },
    },
    populate: {
      child: {
        populate: {
          parents: true,
          center: true,
        },
      },
      createdByUser: true,
    },
  });

  if (!feedbacks.length) {
    console.log('No completed feedbacks pending email, skipping');
    return;
  }

  console.log(`Found ${feedbacks.length} feedbacks to send`);

  let successCount = 0;
  let failCount = 0;

  for (const feedback of feedbacks) {
    const child = feedback.child;
    if (!child) {
      console.log(`Feedback ${feedback.documentId} has no child, skipping`);
      continue;
    }

    const parents = child.parents || [];
    const center = child.center;

    // Check if center has feedback notifications enabled
    if (center && center.isFeedbackNotification === false) {
      console.log(`Center ${center.name} has feedback notifications disabled, skipping feedback for child ${child.firstName}`);
      continue;
    }

    const centerName = center?.displayName || center?.name || 'Kumon Centre';
    const childName = `${child.firstName} ${child.lastName || ''}`.trim();
    const feedbackAuthor = feedback.createdByUser
      ? `${feedback.createdByUser.firstName || ''} ${feedback.createdByUser.lastName || ''}`.trim()
      : undefined;

    // Get all parent emails
    const parentEmails = parents.filter((p) => p.email).map((p) => p.email);

    if (!parentEmails.length) {
      console.log(`No parents with email for child ${childName}, marking as sent`);
      await strapi.documents('api::feedback.feedback').update({
        documentId: feedback.documentId,
        data: { isMailSent: true },
      });
      continue;
    }

    // Use first parent's name for the email template
    const firstParent = parents.find((p) => p.email);
    const parentName = firstParent ? `${firstParent.firstName} ${firstParent.lastName || ''}`.trim() : 'Parent';

    const feedbackDate = feedback.createdDate
      ? moment(feedback.createdDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    const feedbackData = {
      childName,
      parentName,
      schoolYear: child.schoolYear,
      mathScore: feedback.mathScore,
      englishScore: feedback.englishScore,
      mathTime: feedback.mathTime,
      englishTime: feedback.englishTime,
      feedback: feedback.feedback,
      feedbackAuthor,
      date: feedbackDate,
      centerName,
      isFollowUpRequired: feedback.isPercentFeedbackRequired,
    };

    const subject = `Performance Report for ${childName} - ${moment(feedbackData.date).format('MMMM D, YYYY')}`;
    const html = generateFeedbackEmailHtml(feedbackData);
    const text = generateFeedbackEmailText(feedbackData);

    const recipientEmails = testModeEmail || parentEmails.join(', ');

    try {
      const fromEmail = process.env.FEEDBACK_EMAIL_FROM;
      const fromAddress = fromEmail ? `${centerName} <${fromEmail}>` : undefined;
      await strapi.plugins['email'].services.email.send({
        from: fromAddress,
        to: recipientEmails,
        subject: testModeEmail ? `[TEST - ${parentEmails.join(', ')}] ${subject}` : subject,
        html,
        text,
      });
      console.log(
        `Email sent to ${recipientEmails} for ${childName}${testModeEmail ? ` (original: ${parentEmails.join(', ')})` : ''}`
      );
      successCount++;

      await strapi.documents('api::feedback.feedback').update({
        documentId: feedback.documentId,
        data: { isMailSent: true },
      });
    } catch (error) {
      console.error(`Failed to send email to ${parentEmails.join(', ')}:`, error);
      failCount++;
    }
  }

  console.log(`Feedback email task completed: ${successCount} sent, ${failCount} failed`);
};

export default {
  feedbackEmail1pm: {
    task: async ({ strapi }: { strapi: Strapi }) => {
      await sendFeedbackEmails(strapi);
    },
    options: {
      // Run at 1:00 PM every day
      rule: '0 13 * * *',
    },
  },
  feedbackEmail7pm: {
    task: async ({ strapi }: { strapi: Strapi }) => {
      await sendFeedbackEmails(strapi);
    },
    options: {
      // Run at 7:00 PM every day
      rule: '0 19 * * *',
    },
  },
  trialChecker: {
    task: async ({ strapi }: { strapi: Strapi }) => {
      console.log('Running trial checker cron task');
      const centers = await strapi.documents('api::center.center').findMany({
        filters: {
          subscription: {
            status: 'trial',
            trialExpiryDate: {
              $lte: new Date(),
            },
          },
        },
        populate: {
          subscription: true,
        },
      });

      for (const center of centers) {
        const isInvited = await strapi.documents('api::invite-code.invite-code').findMany({
          filters: {
            usedBy: {
              id: center.id,
            },
          },
        });

        if (isInvited.length) {
          console.log(`Center ${center.name} trial is expired, setting to free plan`);
          await strapi.documents('api::center.center').update({
            documentId: center.documentId,
            data: {
              subscription: {
                status: 'free',
                freePlanLimit: 50,
              },
            },
          });
        } else {
          console.log(`Center ${center.name} trial is expired, marking as inactive`);
          await strapi.documents('api::center.center').update({
            documentId: center.documentId,
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
      const centers = await strapi.documents('api::center.center').findMany({
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
          center: {
            id: center.id,
          },
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

        const children = await strapi.documents('api::child.child').findMany({
          filters,
        });

        for (const child of children) {
          if (child.status === 'Exited') {
            continue;
          }
          const payments = await strapi.documents('api::payment.payment').findMany({
            filters: {
              center: {
                id: center.id,
              },
              child: {
                id: child.id,
              },
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
            await strapi.documents('api::child.child').update({
              documentId: child.documentId,
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
              await strapi.documents('api::child.child').update({
                documentId: child.documentId,
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
            await strapi.documents('api::child.child').update({
              documentId: child.documentId,
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
            await strapi.documents('api::child.child').update({
              documentId: child.documentId,
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
