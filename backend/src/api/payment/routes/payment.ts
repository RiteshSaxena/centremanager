/**
 * payment router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::payment.payment', {
  config: {
    find: {
      middlewares: ['global::centre'],
    },
    create: {
      middlewares: ['global::centre'],
    },
    update: {
      middlewares: ['global::centre'],
    },
  },
});
