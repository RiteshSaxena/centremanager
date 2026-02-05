import { Strapi } from '../../types';

const PERMISSIONS = [
  { action: 'api::import-data.import-data.importData', role: 'authenticated' },
  { action: 'api::zoho-books.zoho-books.generateToken', role: 'authenticated' },
  { action: 'api::log-book.log-book.search', role: 'authenticated' },
  { action: 'api::log-book.log-book.searchByLastName', role: 'authenticated' },
  { action: 'api::log-book.log-book.guestSignIn', role: 'authenticated' },
  { action: 'api::log-book.log-book.signIn', role: 'authenticated' },
  { action: 'api::log-book.log-book.signOut', role: 'authenticated' },
  { action: 'api::log-book.log-book.list', role: 'authenticated' },
  { action: 'api::child.child.find', role: 'authenticated' },
  { action: 'api::child.child.findOne', role: 'authenticated' },
  { action: 'api::child.child.create', role: 'authenticated' },
  { action: 'api::child.child.update', role: 'authenticated' },
  { action: 'api::child.child.delete', role: 'authenticated' },
  { action: 'api::child.child.dueStudents', role: 'authenticated' },
  { action: 'api::parent.parent.create', role: 'authenticated' },
  { action: 'api::payment.payment.find', role: 'authenticated' },
  { action: 'api::payment.payment.create', role: 'authenticated' },
  { action: 'api::slot.slot.find', role: 'authenticated' },
  { action: 'api::subject.subject.find', role: 'authenticated' },
  { action: 'api::school.school.find', role: 'authenticated' },
  { action: 'api::slot.slot.findOne', role: 'authenticated' },
  { action: 'api::slot.slot.create', role: 'authenticated' },
  { action: 'api::slot.slot.update', role: 'authenticated' },
  { action: 'api::slot.slot.delete', role: 'authenticated' },
  { action: 'api::center.center.find', role: 'authenticated' },
  { action: 'api::center.center.update', role: 'authenticated' },
  { action: 'api::center.center.register', role: 'public' },
  { action: 'plugin::upload.content-api.upload', role: 'authenticated' },
  { action: 'api::feedback.feedback.getFeedbackByChild', role: 'authenticated' },
  { action: 'api::feedback.feedback.createFeedback', role: 'authenticated' },
  { action: 'api::feedback.feedback.updateTodayFeedbackByChild', role: 'authenticated' },
  { action: 'api::center-user.center-user.find', role: 'authenticated' },
  { action: 'api::center-user.center-user.findOne', role: 'authenticated' },
  { action: 'api::center-user.center-user.create', role: 'authenticated' },
  { action: 'api::center-user.center-user.update', role: 'authenticated' },
  { action: 'api::center-user.center-user.delete', role: 'authenticated' },
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
