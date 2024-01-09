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

    return slots.map((slot) => {
      slot.children = slot.children.map((child) => sanitizeChild(child));
      return slot;
    });
  },
}));
