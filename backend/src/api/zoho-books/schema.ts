import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const generateTokenSchema = yup
  .object()
  .shape({
    code: yup.string().trim().required().min(2).max(250).label('Code'),
    clientId: yup.string().trim().required().min(2).max(250).label('Client ID'),
    clientSecret: yup.string().trim().max(250).label('Client Secret'),
    domain: yup.string().trim().required().min(2).max(10).label('Domain'),
  })
  .noUnknown();

export default {
  generateToken: validateYupSchema(generateTokenSchema),
};
