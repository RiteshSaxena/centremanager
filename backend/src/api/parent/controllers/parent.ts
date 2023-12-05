/**
 * parent controller
 */

import { factories } from '@strapi/strapi';
import schema from '../schema';

export default factories.createCoreController('api::parent.parent', ({ strapi }) => ({
  async create(ctx) {
    const payload = await schema.addParent(ctx.request.body);

    const parent = await strapi.entityService.create('api::parent.parent', {
      data: {
        ...payload,
        contactNumber: payload.phoneNumber,
        children: [payload.child],
        center: ctx.state.center.id,
      },
    });

    return parent;
  },
}));
