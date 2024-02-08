/**
 * log-book controller
 */

import { factories, Strapi } from '@strapi/strapi';
import schema from '../schema';
import utils from '@strapi/utils';
import { sanitizeChild, sanitizeUser } from '../../../utils/sanitize';
import moment from 'moment';

const { ValidationError } = utils.errors;

const checkSubscription = async (strapi: Strapi, centerId: number) => {
  const center = await strapi.entityService.findOne('api::center.center', centerId, {
    populate: ['subscription'],
  });

  if (!center) {
    throw new ValidationError('Center not found');
  }

  if (!center.subscription || center.subscription.status === 'inactive') {
    throw new ValidationError('Centre doesnt have a valid subscription');
  }

  if (center.subscription.status === 'free') {
    const startOfMonth = moment().utc().startOf('week').toDate();

    const entries = await strapi.entityService.count('api::log-book.log-book', {
      filters: {
        center: centerId as any,
        signInTime: {
          $gte: startOfMonth,
        },
      },
    });

    if (entries >= center.subscription.freePlanLimit) {
      throw new ValidationError('Centre exceeded free plan limit');
    }
  }
};

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
  async searchByLastName(ctx) {
    const { lastName, phoneNumber } = await schema.searchByLastName(ctx.request.body);

    const students = await strapi.entityService.findMany('api::child.child', {
      fields: ['firstName', 'lastName', 'gender', 'schoolYear'] as any[],
      filters: {
        center: ctx.state.center.id,
        lastName: {
          $eqi: lastName,
        },
      },
      populate: ['parents'],
    });

    let sanitizedPhone = phoneNumber;

    if (sanitizedPhone.startsWith('0')) {
      sanitizedPhone = sanitizedPhone.substring(1);
    }

    if (sanitizedPhone.startsWith('+44')) {
      sanitizedPhone = sanitizedPhone.substring(3);
    }

    const studentsArr = students.filter((student) => {
      return student.parents.some((parent) => parent.contactNumber.includes(sanitizedPhone));
    });

    return studentsArr.map((student) => {
      return {
        type: 'student',
        ...student,
      };
    });
  },
  async guestSignIn(ctx) {
    const payload = await schema.guestSignIn(ctx.request.body);

    await checkSubscription(strapi, ctx.state.center.id as number);

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

    await checkSubscription(strapi, ctx.state.center.id as number);

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
      andFilters.push({
        signOutTime: {
          $null: true,
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
