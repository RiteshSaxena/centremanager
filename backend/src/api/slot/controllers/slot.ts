/**
 * slot controller
 */

import { factories } from '@strapi/strapi';

import { sanitizeChild } from '../../../utils/sanitize';

export default factories.createCoreController('api::slot.slot', ({ strapi }) => ({
  async find(ctx) {
    const slots = await strapi.entityService.findMany('api::slot.slot', {
      filters: {
        center: ctx.state.center.id,
      },
      populate: ['children'],
    });

    const center = await strapi.entityService.findOne('api::center.center', ctx.state.center.id, {
      populate: ['zohobooks'],
    });

    let booksStudents = [];
    let booksEnabled = false;

    if (center.zohobooks && center.zohobooks.enabled) {
      booksStudents = await strapi.service('api::zoho-books.zoho-books').fetchContacts(center.id as number, center.zohobooks);
      booksEnabled = true;
    }

    return slots.map((slot) => {
      slot.children = slot.children.map((child) => {
        const sanitizedChild = sanitizeChild(child);

        if (booksEnabled) {
          sanitizedChild.dueAmount = 0;
        } else {
          sanitizedChild.dueAmount = -1;
        }

        const bookStudent = booksStudents.find((student: any) => parseInt(student.designation) === sanitizedChild.id);
        if (bookStudent) {
          if (bookStudent.parent.outstanding_receivable_amount > 0) {
            sanitizedChild.dueAmount = bookStudent.parent.outstanding_receivable_amount;
          }
        }

        return sanitizedChild;
      });
      return slot;
    });
  },
}));
