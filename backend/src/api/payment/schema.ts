import utils from '@strapi/utils';

const { yup, validateYupSchema } = utils;

const addPaymentSchema = yup
  .object()
  .shape({
    child: yup.number().required().label('Child'),
    amount: yup.number().required().label('Amount'),
    notes: yup.string().trim().max(250).label('Notes'),
    paymentDate: yup.string().required().label('Payment Date'),
  })
  .noUnknown();

export default {
  addPayment: validateYupSchema(addPaymentSchema),
};
