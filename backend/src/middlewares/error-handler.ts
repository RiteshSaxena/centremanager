/**
 * `error-handler` middleware
 */

import errorHandler from '../utils/error';

export default () => {
  return async (ctx: any, next: () => any) => {
    try {
      await next();
    } catch (err) {
      if (err.name !== 'ValidationError') {
        console.log(err);
      }
      console.log(err);
      errorHandler(err);
    }
  };
};
