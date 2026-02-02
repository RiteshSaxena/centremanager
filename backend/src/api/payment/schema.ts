import { z, validateSchema } from '../../utils/validate';

const addPaymentSchema = z
  .object({
    child: z.number(),
    amount: z.number(),
    notes: z.string().trim().max(250).optional(),
    paymentDate: z.string(),
  })
  .strict();

export default {
  addPayment: validateSchema(addPaymentSchema),
};
