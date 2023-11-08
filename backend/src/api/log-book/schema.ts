import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const searchSchema = yup
  .object()
  .shape({
    text: yup.string().trim().required().min(2).max(250).label('Search Text'),
  })
  .noUnknown();

export default {
  search: validateYupSchema(searchSchema),
};
