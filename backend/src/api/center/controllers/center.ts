/**
 * center controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::center.center', () => ({
  async find(ctx) {
    return ctx.state.center;
  },
}));
