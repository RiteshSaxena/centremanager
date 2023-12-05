/**
 * child router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::child.child', {
  config: {
    find: {
      middlewares: ['global::centre'],
    },
    findOne: {
      middlewares: ['global::centre'],
    },
  },
});
