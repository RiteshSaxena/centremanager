import { Strapi } from '@strapi/strapi';

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
};
