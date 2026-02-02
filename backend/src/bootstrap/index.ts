import { Strapi } from '../../types';

import initSettings from './settings';
import syncPermissions from './permissions';

export default async ({ strapi }: { strapi: Strapi }) => {
  await initSettings(strapi);
  await syncPermissions(strapi);
  await strapi.admin.services.permission.conditionProvider.register({
    displayName: 'Is my centre data',
    name: 'is-my-centre-data',
    plugin: 'admin',
    handler(user) {
      const centreIds = user.roles.map((role) => parseInt(role.description)).filter((id: number) => !isNaN(id));

      if (!centreIds.length) {
        return false;
      }

      if (user.permission.subject === 'api::center.center') {
        return {
          id: {
            $in: centreIds,
          },
        };
      }

      return {
        'center.id': {
          $in: centreIds,
        },
      };
    },
  });
};
