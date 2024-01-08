import { Strapi } from '@strapi/strapi';

const PERMISSIONS = [
  { action: 'api::import-data.import-data.importData', role: 'authenticated' },
  { action: 'api::zoho-books.zoho-books.generateToken', role: 'authenticated' },
  { action: 'api::log-book.log-book.search', role: 'authenticated' },
  { action: 'api::log-book.log-book.guestSignIn', role: 'authenticated' },
  { action: 'api::log-book.log-book.signIn', role: 'authenticated' },
  { action: 'api::log-book.log-book.signOut', role: 'authenticated' },
  { action: 'api::log-book.log-book.list', role: 'authenticated' },
  { action: 'api::child.child.find', role: 'authenticated' },
  { action: 'api::child.child.findOne', role: 'authenticated' },
  { action: 'api::parent.parent.create', role: 'authenticated' },
  { action: 'api::slot.slot.find', role: 'authenticated' },
  { action: 'api::center.center.find', role: 'authenticated' },
  { action: 'api::center.center.register', role: 'public' },
  { action: 'plugin::upload.content-api.upload', role: 'authenticated' },
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
