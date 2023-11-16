/**
 * log-book controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';
import utils from '@strapi/utils';
import { sanitizeUser, sanitizeChild } from '../../../utils/sanitize';

const { ValidationError, ApplicationError } = utils.errors;
export default factories.createCoreController('api::log-book.log-book', ({ strapi }) => ({
  async search(ctx) {
    const { text } = await schema.search(ctx.request.body);

    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const students = await strapi.entityService.findMany('api::child.child', {
      fields: ['firstName', 'lastName', 'gender', 'schoolYear'] as any[],
      filters: {
        $and: [
          {
            center: center[0].id as any,
          },
          {
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
        ],
      },
      populate: ['parents'],
    });

    const staff = await strapi.entityService.findMany('plugin::users-permissions.user', {
      fields: ['firstName', 'lastName', 'email'] as any[],
      filters: {
        $and: [
          {
            center: center[0].id as any,
          },
          {
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
  async guestSignIn(ctx) {
    const payload = await schema.guestSignIn(ctx.request.body);

    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const entry = await strapi.entityService.create('api::log-book.log-book', {
      data: {
        type: 'Guest',
        signatureIn: payload.signature,
        signInTime: new Date(),
        center: center[0].id,
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
  async signIn(ctx) {
    const payload = await schema.signIn(ctx.request.body);

    const data: any = {};

    if (payload.type === 'Staff') {
      if (!payload.staff) {
        throw new ValidationError('Staff is required');
      }
      data.staff = payload.staff;
    }

    if (payload.type === 'Student' || payload.type === 'StudentWithParent') {
      if (!payload.student) throw new ValidationError('Student is required');
      if (!payload.parent) throw new ValidationError('Parent is required');

      data.student = payload.student;
      data.parent = payload.parent;
    }

    if (payload.type === 'Parent') {
      if (!payload.parent) throw new ValidationError('Parent is required');

      data.parent = payload.parent;
    }

    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const alreadySignedIn = await strapi.entityService.findMany('api::log-book.log-book', {
      filters: {
        type: payload.type,
        center: center[0].id as any,
        ...data,
        signInTime: {
          $gte: date,
        },
        signOutTime: null,
      },
      limit: 1,
    });

    if (alreadySignedIn.length) {
      throw new ValidationError('Already signed in');
    }

    const entry = await strapi.entityService.create('api::log-book.log-book', {
      data: {
        type: payload.type,
        signatureIn: payload.signature,
        signInTime: new Date(),
        center: center[0].id,
        ...data,
      },
    });

    return entry;
  },
  async signOut(ctx) {
    const payload = await schema.signOut(ctx.request.body);

    const entry = await strapi.entityService.findOne('api::log-book.log-book', payload.signIn);

    if (!entry) {
      throw new ValidationError('Entry not found');
    }

    if (entry.signOutTime) {
      throw new ValidationError('Already signed out');
    }

    await strapi.entityService.update('api::log-book.log-book', entry.id, {
      data: {
        signOutTime: new Date(),
        signatureOut: payload.signature,
      },
    });

    return true;
  },
  async list() {
    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const entries = await strapi.entityService.findMany('api::log-book.log-book', {
      filters: {
        center: center[0].id as any,
        signInTime: {
          $gte: date,
        },
        signOutTime: null,
      },
      populate: ['student', 'parent', 'staff', 'guest'],
    });

    return entries.map((entry: any) => {
      if (entry.student) {
        entry.student = sanitizeChild(entry.student);
      }
      if (entry.staff) {
        entry.staff = sanitizeUser(entry.staff);
      }
      return entry;
    });
  },
}));
