/**
 * log-book controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';
import utils from '@strapi/utils';
import { sanitizeChild, sanitizeUser } from '../../../utils/sanitize';
import moment from 'moment';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::log-book.log-book', ({ strapi }) => ({
  async search(ctx) {
    const { text } = await schema.search(ctx.request.body);

    const students = await strapi.entityService.findMany('api::child.child', {
      fields: ['firstName', 'lastName', 'gender', 'schoolYear'] as any[],
      filters: {
        $and: [
          {
            center: ctx.state.center.id,
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
            center: ctx.state.center.id,
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

    return await strapi.entityService.create('api::log-book.log-book', {
      data: {
        type: 'Guest',
        signatureIn: payload.signature,
        signInTime: new Date(),
        center: ctx.state.center.id,
        guest: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
        },
      },
    });
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

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const alreadySignedIn = await strapi.entityService.findMany('api::log-book.log-book', {
      filters: {
        type: payload.type,
        center: ctx.state.center.id as any,
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

    return await strapi.entityService.create('api::log-book.log-book', {
      data: {
        type: payload.type,
        signatureIn: payload.signature,
        signInTime: new Date(),
        center: ctx.state.center.id,
        ...data,
      },
    });
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
  async list(ctx) {
    const andFilters: any[] = [
      {
        center: ctx.state.center.id as any,
      },
    ];
    let sort = 'signInTime';

    andFilters.push();

    let date = new Date();

    if (ctx.request.query.date) {
      date = moment.utc(ctx.request.query.date, 'YYYY-MM-DD').toDate();
      const minDate = moment.utc(date).hours(0).minutes(0).seconds(0).toDate();

      andFilters.push({
        signInTime: {
          $gte: minDate,
        },
      });

      const maxDate = moment.utc(date).hours(23).minutes(59).seconds(59).toDate();

      andFilters.push({
        signInTime: {
          $lte: maxDate,
        },
      });
    } else if (ctx.request.query.student) {
      andFilters.push({
        student: parseInt(ctx.request.query.student),
      });
      sort = 'signInTime:desc';
    } else if (ctx.request.query.staff) {
      andFilters.push({
        staff: parseInt(ctx.request.query.staff),
      });
      sort = 'signInTime:desc';
    } else {
      const minDate = moment.utc(date).hours(0).minutes(0).seconds(0).toDate();

      andFilters.push({
        signInTime: {
          $gte: minDate,
        },
      });
    }

    const entries = await strapi.entityService.findMany('api::log-book.log-book', {
      filters: {
        $and: [...andFilters],
      },
      populate: ['student', 'parent', 'staff', 'guest'],
      sort: sort as any,
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
