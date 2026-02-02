import { z, validateSchema } from '../../utils/validate';

const addParentSchema = z
  .object({
    firstName: z.string().trim().min(2).max(250),
    lastName: z.string().trim().min(2).max(250),
    email: z.string().trim().max(250).optional(),
    phoneNumber: z.string().trim().min(2).max(250),
    child: z.number(),
  })
  .strict();

export default {
  addParent: validateSchema(addParentSchema),
};
