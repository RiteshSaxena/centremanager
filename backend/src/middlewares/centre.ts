/**
 * `centre` middleware
 */

import { Strapi } from '@strapi/strapi';
import utils from '@strapi/utils';

const { ValidationError } = utils.errors;

export default (config, { strapi }: { strapi: Strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    if (ctx.state.user) {
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', ctx.state.user.id, {
        populate: ['center'],
      });

      if (!user.center) {
        throw new ValidationError('User does not have a center assigned');
      }

      ctx.state.center = user.center;
    } else {
      throw new ValidationError('User not authenticated');
    }

    await next();
  };
};
