/**
 * log-book controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';

export default factories.createCoreController('api::log-book.log-book', ({ strapi }) => ({
  async search(ctx: any) {
    const { text } = await schema.search(ctx.request.body);

    const students = await strapi.entityService.findMany('api::child.child', {
      fields: ['firstName', 'lastName', 'gender', 'schoolYear'] as any[],
      filters: {
        $or: [
          {
            firstName: {
              $containsi: text,
            },
          },
          {
            lastName: {
              $containsi: text,
            },
          },
        ],
      },
      populate: ['parents'],
    });

    const staff = await strapi.entityService.findMany('plugin::users-permissions.user', {
      fields: ['firstName', 'lastName', 'email'] as any[],
      filters: {
        $or: [
          {
            firstName: {
              $containsi: text,
            },
          },
          {
            lastName: {
              $containsi: text,
            },
          },
          {
            email: {
              $containsi: text,
            },
          },
        ],
      },
    });

    const studentsArr = students.map((student) => {
      return {
        type: 'student',
        ...student,
      };
    });

    const staffArr = staff.map((staff) => {
      return {
        type: 'staff',
        ...staff,
      };
    });

    return [...studentsArr, ...staffArr];
  },
}));
