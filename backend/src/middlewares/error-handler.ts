/**
 * `error-handler` middleware
 */

import errorHandler from '../utils/error';

export default () => {
  return async (ctx: any, next: () => any) => {
    try {
      await next();
    } catch (err) {
      console.log(err);
      errorHandler(err);
    }
  };
};
