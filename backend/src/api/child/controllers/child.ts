/**
 * child controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import { sanitizeChild } from '../../../utils/sanitize';

const { ValidationError } = utils.errors;

export default factories.createCoreController('api::child.child', ({ strapi }) => ({
  async find(ctx) {
    const entries = await strapi.entityService.findMany('api::child.child', {
      filters: {
        center: ctx.state.center,
      },
      populate: ['center'],
      sort: { firstName: 'asc' },
    });

    return entries.map((entry) => sanitizeChild(entry));
  },
  async findOne(ctx) {
    const entry = await strapi.entityService.findOne('api::child.child', ctx.params.id, {
      populate: ['parents', 'center'],
    });

    if (!entry) {
      throw new ValidationError('Child not found');
    }

    if (entry.center.id !== ctx.state.center.id) {
      throw new ValidationError('Child not found');
    }

    const parents = await Promise.all(
      entry.parents.map(async (parent) => {
        const hasLogBook = await strapi.entityService.findMany('api::log-book.log-book', {
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
            signatureId: (hasLogBook[0] as any).signatureIn.id,
          };
        }

        return parent;
      })
    );

    return sanitizeChild({
      ...entry,
      parents,
    });
  },
  async dueStudents(ctx) {
    const center = await strapi.entityService.findOne('api::center.center', ctx.state.center.id, {
      populate: ['zohobooks'],
    });

    let dueStudents = [];
    let booksEnabled = false;

    if (center.paymentHandler === 'zohobooks') {
      let booksStudents = [];
      if (center.zohobooks) {
        booksEnabled = true;
        booksStudents = await strapi
          .service('api::zoho-books.zoho-books')
          .fetchContacts(center.id as number, center.zohobooks);
        booksEnabled = true;
      }

      dueStudents = booksStudents
        .filter((student: any) => student.parent.outstanding_receivable_amount > 0)
        .map((student: any) => {
          return {
            id: parseInt(student.designation),
            dueAmount: student.parent.outstanding_receivable_amount,
          };
        });
    } else if (center.paymentHandler === 'inbuilt') {
      booksEnabled = true;
      dueStudents = await strapi.entityService.findMany('api::child.child', {
        filters: {
          center: ctx.state.center.id,
          status: {
            $ne: 'New',
          },
          isDue: true,
        },
      });
      dueStudents = dueStudents.map((student) => ({
        ...sanitizeChild(student),
        id: student.id,
        dueAmount: student.dueAmount || center.defaultDueAmount || 1,
      }));
    }

    return {
      booksEnabled,
      dueStudents,
    };
  },
}));
