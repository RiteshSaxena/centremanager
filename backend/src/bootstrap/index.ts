import { Strapi } from '@strapi/strapi';

import initSettings from './settings';
import syncPermissions from './permissions';

export default async ({ strapi }: { strapi: Strapi }) => {
  await initSettings(strapi);
  await syncPermissions(strapi);
  await strapi.admin.services.permission.conditionProvider.register({
    displayName: 'Is my centre data',
    name: 'is-my-centre-data',
    plugin: 'admin',
    async handler(user) {
      if (!user.roles[0].description) {
        return false;
      }

      const centreId = parseInt(user.roles[0].description);

      if (isNaN(centreId)) {
        return false;
      }

      const center = await strapi.entityService.findOne('api::center.center', centreId);

      if (!center) {
        return false;
      }

      return {
        center,
      };
    },
  });
};
