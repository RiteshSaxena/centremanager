/**
 * log-book controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';
import utils from '@strapi/utils';
import { sanitizeChild, sanitizeUser } from '../../../utils/sanitize';
import moment from 'moment';
import type { Strapi } from '../../../../types';

const { ValidationError } = utils.errors;

const checkSubscription = async (strapi: Strapi, centerId: number) => {
  const center = await strapi.documents('api::center.center').findFirst({
    filters: {
      id: centerId,
    },
    populate: {
      subscription: true,
    },
  });

  if (!center) {
    throw new ValidationError('Center not found');
  }

  if (!center.subscription || center.subscription.status === 'inactive') {
    throw new ValidationError('Centre doesnt have a valid subscription');
  }

  if (center.subscription.status === 'free') {
    const startOfMonth = moment().utc().startOf('week').toDate();

    const entries = await strapi.documents('api::log-book.log-book').count({
      filters: {
        center: {
          id: centerId,
        },
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

    const childOnly = ctx.query.childOnly === 'true';

    const students = await strapi.documents('api::child.child').findMany({
      fields: ['firstName', 'lastName', 'gender', 'schoolYear'],
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

    if (childOnly) {
      return students.map((student) => {
        return {
          type: 'student',
          ...student,
        };
      });
    }

    const staff = await strapi.documents('plugin::users-permissions.user').findMany({
      fields: ['firstName', 'lastName', 'email'],
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
    const { lastName } = await schema.searchByLastName(ctx.request.body);

    const students = await strapi.documents('api::child.child').findMany({
      fields: ['firstName', 'lastName', 'gender', 'schoolYear'],
      filters: {
        center: ctx.state.center.id,
        lastName: {
          $eqi: lastName,
        },
      },
      populate: ['parents'],
    });

    const studentArr = await Promise.all(
      students.map(async (student) => {
        const parents = await Promise.all(
          student.parents.map(async (parent) => {
            const hasLogBook = await strapi.documents('api::log-book.log-book').findMany({
              filters: {
                type: {
                  $in: ['Student', 'StudentWithParent'],
                },
                parent: {
                  id: parent.id,
                },
                signInTime: {
                  $notNull: true,
                },
              },
              sort: 'signInTime:desc',
              populate: ['signatureIn'],
              limit: 1,
            });

            if (hasLogBook.length) {
              return {
                ...parent,
                signatureId: hasLogBook[0].signatureIn.id,
              };
            }

            return parent;
          })
        );

        return {
          type: 'student',
          ...student,
          parents,
        };
      })
    );

    const staff = await strapi.documents('plugin::users-permissions.user').findMany({
      fields: ['firstName', 'lastName', 'email'],
      filters: {
        center: ctx.state.center.id,
        lastName: {
          $eqi: lastName,
        },
      },
    });

    const staffArr = staff.map((s) => {
      return {
        type: 'staff',
        ...s,
      };
    });

    return [...studentArr, ...staffArr];
  },
  async guestSignIn(ctx) {
    const payload = await schema.guestSignIn(ctx.request.body);

    await checkSubscription(strapi, ctx.state.center.id as number);

    return await strapi.documents('api::log-book.log-book').create({
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

    const alreadySignedIn = await strapi.documents('api::log-book.log-book').findMany({
      filters: {
        type: payload.type,
        center: {
          id: ctx.state.center.id,
        },
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

    return await strapi.documents('api::log-book.log-book').create({
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

    const entry = await strapi.documents('api::log-book.log-book').findFirst({
      filters: {
        id: payload.signIn,
      },
    });

    if (!entry) {
      throw new ValidationError('Entry not found');
    }

    if (entry.signOutTime) {
      throw new ValidationError('Already signed out');
    }

    await strapi.documents('api::log-book.log-book').update({
      documentId: entry.documentId,
      data: {
        signOutTime: new Date(),
        signatureOut: payload.signature,
      },
    });

    return true;
  },
  async list(ctx) {
    const populate = [];
    const andFilters: any[] = [
      {
        center: {
          id: ctx.state.center.id,
        },
      },
    ];
    let sort = 'signInTime:desc';

    let date = new Date();
    let feedbackDate = new Date().toISOString().split('T')[0];

    if (ctx.request.query.date) {
      feedbackDate = ctx.request.query.date as string;
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
        student: parseInt(ctx.request.query.student as string),
      });
      sort = 'signInTime:desc';
    } else if (ctx.request.query.staff) {
      andFilters.push({
        staff: parseInt(ctx.request.query.staff as string),
      });
      sort = 'signInTime:desc';
    } else {
      andFilters.push({
        signOutTime: {
          $null: true,
        },
      });
      populate.push('signatureIn');
    }

    const entries = await strapi.documents('api::log-book.log-book').findMany({
      filters: {
        $and: [...andFilters],
      },
      populate: ['student', 'student.subjects', 'parent', 'staff', 'guest', ...populate],
      sort: sort as 'signInTime:desc' | 'signInTime:asc',
    });

    let feedbacks = [];
    if (feedbackDate) {
      const studentIds: number[] = entries.filter((entry) => entry.student).map((entry) => entry.student.id as number);

      feedbacks = await strapi.documents('api::feedback.feedback').findMany({
        filters: {
          child: {
            id: {
              $in: studentIds,
            },
          },
          createdDate: feedbackDate,
        },
        populate: {
          child: true,
          createdByUser: true,
        },
      });
    }

    return entries.map((entry: any) => {
      if (entry.student) {
        entry.student = sanitizeChild(entry.student);
        const feedback = feedbacks.find((fb) => fb.child.id === entry.student.id);
        if (feedback) {
          entry.feedback = {
            ...feedback,
            createdByUser: sanitizeUser(feedback.createdByUser),
          };
        }
      }
      if (entry.staff) {
        entry.staff = sanitizeUser(entry.staff);
      }

      if (entry.signatureIn) {
        entry.signatureId = entry.signatureIn.id;
      }

      delete entry.signatureIn;

      return entry;
    });
  },
}));
