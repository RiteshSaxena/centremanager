import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const centreRegisterSchema = yup
  .object()
  .shape({
    inviteCode: yup.string().trim().required().min(6).max(10).label('Invite Code'),
    firstName: yup.string().trim().required().min(2).max(64).label('First Name'),
    lastName: yup.string().trim().required().min(2).max(64).label('Last Name'),
    email: yup.string().email().trim().max(250).label('Email'),
    password: yup.string().trim().min(8).max(32).label('Password'),
    phoneNumber: yup.string().trim().required().min(6).max(15).label('Phone Number'),
    centerName: yup.string().trim().required().min(4).max(32).label('Centre Name'),
    centerRegion: yup.string().trim().required().min(4).max(32).label('Centre Region'),
  })
  .noUnknown();

export default {
  centreRegister: validateYupSchema(centreRegisterSchema),
};
