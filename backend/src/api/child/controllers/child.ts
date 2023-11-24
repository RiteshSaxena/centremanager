/**
 * child controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';

const { ApplicationError } = utils.errors;
import { sanitizeChild } from '../../../utils/sanitize';

export default factories.createCoreController('api::child.child', ({ strapi }) => ({
  async find() {
    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const entries = await strapi.entityService.findMany('api::child.child', {
      filters: {
        center: center[0],
      },
      populate: ['center'],
      sort: { firstName: 'asc' },
    });

    return entries.map((entry) => sanitizeChild(entry));
  },
  async findOne(ctx) {
    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const entry = await strapi.entityService.findOne('api::child.child', ctx.params.id, {
      populate: ['parents', 'center'],
    });

    if (!entry) {
      throw new ApplicationError('Child not found');
    }

    if (entry.center.id !== center[0].id) {
      throw new ApplicationError('Child not found');
    }

    return sanitizeChild(entry);
  },
}));
