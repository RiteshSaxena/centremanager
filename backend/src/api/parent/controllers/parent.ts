/**
 * parent controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';
import utils from '@strapi/utils';

const { ApplicationError } = utils.errors;

export default factories.createCoreController('api::parent.parent', ({ strapi }) => ({
  async create(ctx) {
    const payload = await schema.addParent(ctx.request.body);

    const center = await strapi.entityService.findMany('api::center.center', {
      limit: 1,
    });

    if (!center.length) {
      throw new ApplicationError('Center not found');
    }

    const parent = await strapi.entityService.create('api::parent.parent', {
      data: {
        ...payload,
        contactNumber: payload.phoneNumber,
        children: [payload.child],
        center: center[0].id,
      },
    });

    return parent;
  },
}));
