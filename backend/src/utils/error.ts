import { ZodError } from 'zod';
import utils from '@strapi/utils';

const { ValidationError } = utils.errors;

interface ErrorWithDetails extends Error {
  details?: {
    errors?: Array<{ message: string }>;
  };
}

export const formatZodError = (error: ZodError): string => {
  const firstError = error.issues[0];
  const path = firstError.path.join('.');
  return path ? `${path}: ${firstError.message}` : firstError.message;
};

const errorHandler = (error: Error | ZodError | ErrorWithDetails) => {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    throw new ValidationError(formatZodError(error));
  }

  // Handle Strapi validation errors
  if (error.name === 'ValidationError') {
    const err = error as ErrorWithDetails;
    let errorMessage = error.message;
    if (err.details?.errors?.length) {
      errorMessage = err.details.errors[0].message;
    }
    throw new ValidationError(errorMessage);
  }

  throw error;
};

export default errorHandler;
