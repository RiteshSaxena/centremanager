/**
 * `error-handler` middleware
 */

import type { Context, Next } from '../../types';
import errorHandler from '../utils/error';

export default () => {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      if (err instanceof Error && err.name !== 'ValidationError') {
        console.log(err);
      }
      console.log(err);
      errorHandler(err as Error);
    }
  };
};
