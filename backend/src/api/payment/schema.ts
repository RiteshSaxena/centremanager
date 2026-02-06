import { z, validateSchema } from '../../utils/validate';

const addPaymentSchema = z
  .object({
    child: z.number(),
    amount: z.number(),
    notes: z.string().trim().max(250).optional(),
    paymentDate: z.string(),
  })
  .strict();

const updatePaymentSchema = z
  .object({
    amount: z.number().optional(),
    notes: z.string().trim().max(250).optional().nullable(),
    paymentDate: z.string().optional(),
  })
  .strict();

export default {
  addPayment: validateSchema(addPaymentSchema),
  updatePayment: validateSchema(updatePaymentSchema),
};
