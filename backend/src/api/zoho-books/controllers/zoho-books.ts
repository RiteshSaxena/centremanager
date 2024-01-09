/**
 * A set of functions called "actions" for `zoho-books`
 */
import schema from '../schema';

export default {
  generateToken: async (ctx) => {
    const payload = await schema.generateToken(ctx.request.body);

    return await strapi.service('api::zoho-books.zoho-books').generateToken({
      code: payload.code,
      clientId: payload.clientId,
      clientSecret: payload.clientSecret,
      domain: payload.domain,
    });
  },
};
