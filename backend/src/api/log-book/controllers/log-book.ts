/**
 * log-book controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';
import utils from '@strapi/utils';

const { ValidationError } = utils.errors;
export default factories.createCoreController('api::log-book.log-book', ({ strapi }) => ({
  async search(ctx) {
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
  async guestSign(ctx) {
    const payload = await schema.guestSign(ctx.request.body);

    const entry = await strapi.entityService.create('api::log-book.log-book', {
      data: {
        type: payload.type,
        signature: payload.signature,
        time: new Date(),
        isGuest: true,
        center: 5,
        guest: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
        },
      },
    });

    return entry;
  },
  async sign(ctx) {
    const payload = await schema.sign(ctx.request.body);

    if (payload.isStaff && !payload.staff) {
      throw new ValidationError('Staff is required');
    }

    if (payload.isStudent && (!payload.student || !payload.parent)) {
      throw new ValidationError('Student and Parent is required');
    }

    const data: any = {};

    if (payload.isStaff) {
      data.staff = payload.staff;
      data.isStaff = true;
    }

    if (payload.isStudent) {
      data.student = payload.student;
      data.parent = payload.parent;
      data.isStudent = true;
      data.isParentWithStudent = payload.isParentWithStudent;
    }

    const entry = await strapi.entityService.create('api::log-book.log-book', {
      data: {
        type: payload.type,
        signature: payload.signature,
        time: new Date(),
        center: 5,
        ...data,
      },
    });

    return entry;
  },
}));
