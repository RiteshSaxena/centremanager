import { z, ZodSchema, ZodError } from 'zod';
import utils from '@strapi/utils';

const { ValidationError } = utils.errors;

export const validateSchema = <T extends ZodSchema>(schema: T) => {
  return async (data: unknown): Promise<z.infer<T>> => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const path = firstError.path.join('.');
        const message = path ? `${path}: ${firstError.message}` : firstError.message;
        throw new ValidationError(message);
      }
      throw error;
    }
  };
};

export { z };
