import { z, validateSchema } from '../../utils/validate';

const createUserSchema = z
  .object({
    firstName: z.string().trim().min(1).max(64),
    lastName: z.string().trim().max(64).optional(),
    email: z.string().email().trim().max(250),
    password: z.string().trim().min(8).max(32),
    phoneNumber: z.string().trim().max(20).optional(),
    type: z.enum(['admin', 'staff']),
  })
  .strict();

const updateUserSchema = z
  .object({
    firstName: z.string().trim().min(1).max(64).optional(),
    lastName: z.string().trim().max(64).optional(),
    email: z.string().email().trim().max(250).optional(),
    password: z.string().trim().min(8).max(32).optional(),
    phoneNumber: z.string().trim().max(20).optional(),
    type: z.enum(['admin', 'staff']).optional(),
  })
  .strict();

export default {
  createUser: validateSchema(createUserSchema),
  updateUser: validateSchema(updateUserSchema),
};
