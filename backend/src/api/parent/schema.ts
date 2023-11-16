import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const addParentSchema = yup
  .object()
  .shape({
    firstName: yup.string().trim().required().min(2).max(250).label('First Name'),
    lastName: yup.string().trim().required().min(2).max(250).label('Last Name'),
    email: yup.string().trim().max(250).label('Email'),
    phoneNumber: yup.string().trim().required().min(2).max(250).label('Phone Number'),
    child: yup.number().required().label('Child'),
  })
  .noUnknown();

export default {
  addParent: validateYupSchema(addParentSchema),
};
