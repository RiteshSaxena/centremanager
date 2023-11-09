import { Strapi } from '@strapi/strapi';

const PERMISSIONS = [
  { action: 'api::import-data.import-data.importData', role: 'public' },
  { action: 'api::log-book.log-book.search', role: 'public' },
  { action: 'api::log-book.log-book.guestSign', role: 'public' },
  { action: 'api::log-book.log-book.sign', role: 'public' },
  { action: 'api::parent.parent.create', role: 'public' },
  { action: 'plugin::upload.upload', role: 'public' },
];

const syncPermissions = async (strapi: Strapi) => {
  const roles = await strapi.query('plugin::users-permissions.role').findMany();
  for (const permission of PERMISSIONS) {
    const role = roles.find((item) => item.type === permission.role);
    if (role) {
      const dbPermission = await strapi.query('plugin::users-permissions.permission').findMany({
        filters: {
          action: permission.action,
          role: role.id,
        },
      });
      if (dbPermission.length === 0) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: permission.action,
            role: role.id,
          },
        });
      }
    }
  }
};

export default syncPermissions;
