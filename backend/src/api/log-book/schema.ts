import { z, validateSchema } from '../../utils/validate';

const searchSchema = z
  .object({
    text: z.string().trim().min(1).max(250),
  })
  .strict();

const searchByLastNameSchema = z
  .object({
    lastName: z.string().trim().min(1).max(250),
  })
  .strict();

const guestSignInSchema = z
  .object({
    firstName: z.string().trim().min(2).max(250),
    lastName: z.string().trim().min(2).max(250),
    email: z.string().trim().max(250).optional(),
    phoneNumber: z.string().trim().max(250).optional(),
    signature: z.number(),
  })
  .strict();

const signInSchema = z
  .object({
    signature: z.number(),
    type: z.enum(['Staff', 'Student', 'StudentWithParent', 'Parent']),
    student: z.number().optional(),
    parent: z.number().optional(),
    staff: z.number().optional(),
  })
  .strict();

const signOutSchema = z
  .object({
    signIn: z.number(),
    signature: z.number(),
  })
  .strict();

export default {
  search: validateSchema(searchSchema),
  guestSignIn: validateSchema(guestSignInSchema),
  signIn: validateSchema(signInSchema),
  signOut: validateSchema(signOutSchema),
  searchByLastName: validateSchema(searchByLastNameSchema),
};
