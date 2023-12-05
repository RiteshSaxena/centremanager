/**
 * child controller
 */

import { factories } from '@strapi/strapi';
import utils from '@strapi/utils';

const { ApplicationError } = utils.errors;
import { sanitizeChild } from '../../../utils/sanitize';

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
}));
