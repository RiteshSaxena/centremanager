/**
 * slot controller
 */

import { factories } from '@strapi/strapi';

import utils from '@strapi/utils';
import { sanitizeChild } from '../../../utils/sanitize';

const { ApplicationError } = utils.errors;

export default factories.createCoreController('api::slot.slot', ({ strapi }) => ({
  async find() {
    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const slots = await strapi.entityService.findMany('api::slot.slot', {
      filters: {
        center: center[0].id as any,
      },
      populate: ['children'],
    });

    return slots.map((slot) => {
      slot.children = slot.children.map((child) => sanitizeChild(child));
      return slot;
    });
  },
}));
