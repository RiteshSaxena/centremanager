/**
 * child controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';
import { sanitizeChild } from '../../../utils/sanitize';

const { ApplicationError } = utils.errors;

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
      throw new ApplicationError('Child not found');
    }

    if (entry.center.id !== ctx.state.center.id) {
      throw new ApplicationError('Child not found');
    }

    return sanitizeChild(entry);
  },
  async dueStudents(ctx) {
    const center = await strapi.entityService.findOne('api::center.center', ctx.state.center.id, {
      populate: ['zohobooks'],
    });

    let booksStudents = [];
    let booksEnabled = false;

    if (center.zohobooks && center.zohobooks.enabled) {
      booksStudents = await strapi
        .service('api::zoho-books.zoho-books')
        .fetchContacts(center.id as number, center.zohobooks);
      booksEnabled = true;
    }

    const dueStudents = booksStudents
      .filter((student: any) => student.parent.outstanding_receivable_amount > 0)
      .map((student: any) => {
        return {
          id: parseInt(student.designation),
          dueAmount: student.parent.outstanding_receivable_amount,
        };
      });

    return {
      booksEnabled,
      dueStudents,
    };
  },
}));
