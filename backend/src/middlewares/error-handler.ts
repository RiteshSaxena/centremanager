/**
 * `error-handler` middleware
 */

import { ZodError } from 'zod';
import type { Context, Next } from '../../types';
import errorHandler from '../utils/error';

export default () => {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      const isValidationError = err instanceof ZodError || (err instanceof Error && err.name === 'ValidationError');

      if (!isValidationError) {
        console.error(err);
      }

      errorHandler(err as Error);
    }
  };
};
