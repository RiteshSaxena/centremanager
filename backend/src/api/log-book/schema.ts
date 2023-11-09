import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const searchSchema = yup
  .object()
  .shape({
    text: yup.string().trim().required().min(1).max(250).label('Search Text'),
  })
  .noUnknown();

const guestSignSchema = yup
  .object()
  .shape({
    firstName: yup.string().trim().required().min(2).max(250).label('First Name'),
    lastName: yup.string().trim().required().min(2).max(250).label('Last Name'),
    email: yup.string().trim().required().min(2).max(250).label('Email'),
    phoneNumber: yup.string().trim().required().min(2).max(250).label('Phone Number'),
    signature: yup.number().required().label('Signature'),
    type: yup.mixed().oneOf(['SignIn', 'SignOut']).required().label('Type'),
  })
  .noUnknown();

const signSchema = yup
  .object()
  .shape({
    signature: yup.number().required().label('Signature'),
    type: yup.mixed().oneOf(['SignIn', 'SignOut']).required().label('Type'),
    student: yup.number().label('Student'),
    parent: yup.number().label('Parent'),
    staff: yup.number().label('Staff'),
    isStaff: yup.boolean().label('Is Staff'),
    isStudent: yup.boolean().label('Is Student'),
    isParentWithStudent: yup.boolean().label('Is Parent With Student'),
  })
  .noUnknown();

export default {
  search: validateYupSchema(searchSchema),
  guestSign: validateYupSchema(guestSignSchema),
  sign: validateYupSchema(signSchema),
};
