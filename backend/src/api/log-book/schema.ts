import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const searchSchema = yup
  .object()
  .shape({
    text: yup.string().trim().required().min(1).max(250).label('Search Text'),
  })
  .noUnknown();

const searchByLastNameSchema = yup
  .object()
  .shape({
    lastName: yup.string().trim().required().min(1).max(250).label('Last Name'),
    phoneNumber: yup.string().trim().min(10).required().label('Phone Number'),
  })
  .noUnknown();

const guestSignInSchema = yup
  .object()
  .shape({
    firstName: yup.string().trim().required().min(2).max(250).label('First Name'),
    lastName: yup.string().trim().required().min(2).max(250).label('Last Name'),
    email: yup.string().trim().max(250).label('Email'),
    phoneNumber: yup.string().trim().required().min(2).max(250).label('Phone Number'),
    signature: yup.number().required().label('Signature'),
  })
  .noUnknown();

const signInSchema = yup
  .object()
  .shape({
    signature: yup.number().required().label('Signature'),
    type: yup.mixed().oneOf(['Staff', 'Student', 'StudentWithParent', 'Parent']).required().label('Type'),
    student: yup.number().label('Student'),
    parent: yup.number().label('Parent'),
    staff: yup.number().label('Staff'),
  })
  .noUnknown();

const signOutSchema = yup
  .object()
  .shape({
    signIn: yup.number().required().label('Sign In'),
    signature: yup.number().required().label('Signature'),
  })
  .noUnknown();

export default {
  search: validateYupSchema(searchSchema),
  guestSignIn: validateYupSchema(guestSignInSchema),
  signIn: validateYupSchema(signInSchema),
  signOut: validateYupSchema(signOutSchema),
  searchByLastName: validateYupSchema(searchByLastNameSchema),
};
