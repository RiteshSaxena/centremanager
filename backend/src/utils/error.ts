import utils from '@strapi/utils';

const { ValidationError } = utils.errors;

const errorHandler = (error: any) => {
  if (error.name === 'ValidationError') {
    let errorMessage = '';
    if (error.details && error.details.errors && error.details.errors.length) {
      errorMessage = error.details.errors[0].message;
    } else {
      errorMessage = error.message;
    }
    throw new ValidationError(errorMessage);
  }
  throw error;
};

export default errorHandler;
