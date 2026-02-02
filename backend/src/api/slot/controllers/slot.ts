/**
 * slot controller
 */

import { factories } from '@strapi/strapi';

import { sanitizeChild } from '../../../utils/sanitize';

export default factories.createCoreController('api::slot.slot', ({ strapi }) => ({
  async find(ctx) {
    const slots = await strapi.documents('api::slot.slot').findMany({
      filters: {
        center: {
          id: ctx.state.center.id,
        },
      },
      populate: ['children'],
    });

    return slots.map((slot) => ({
      ...slot,
      children: slot.children.map((child) => sanitizeChild(child)),
    }));
  },
}));
