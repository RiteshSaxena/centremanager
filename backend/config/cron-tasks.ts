import { Strapi } from '@strapi/strapi';
import moment from 'moment';

export default {
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
