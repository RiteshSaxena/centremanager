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

    if (center.zohobooks && center.zohobooks.enabled) {
      booksStudents = await strapi.service('api::zoho-books.zoho-books').fetchContacts(center.id as number, center.zohobooks);
    }

    return slots.map((slot) => {
      slot.children = slot.children.map((child) => {
        const sanitizedChild = sanitizeChild(child);

        const bookStudent = booksStudents.find((student: any) => parseInt(student.designation) === sanitizedChild.id);
        if (bookStudent) {
          if (bookStudent.parent.outstanding_receivable_amount > 0) {
            sanitizedChild.isDuePending = true;
          }
        }

        return sanitizedChild;
      });
      return slot;
    });
  },
}));
