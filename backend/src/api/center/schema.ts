import { z, validateSchema } from '../../utils/validate';

const centreRegisterSchema = z
  .object({
    inviteCode: z.string().trim().min(6).max(10),
    firstName: z.string().trim().min(2).max(64),
    lastName: z.string().trim().min(2).max(64),
    email: z.string().email().trim().max(250),
    password: z.string().trim().min(8).max(32),
    phoneNumber: z.string().trim().min(6).max(15),
    centerName: z.string().trim().min(4).max(32),
  })
  .strict();

const centreUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(64).optional(),
    displayName: z.string().trim().min(2).max(64).optional(),
    region: z.string().trim().max(64).optional(),
    email: z.string().email().trim().max(250).optional().nullable(),
    phoneNumber: z.string().trim().max(20).optional().nullable(),
    isFeedbackNotification: z.boolean().optional(),
  })
  .strict();

export default {
  centreRegister: validateSchema(centreRegisterSchema),
  centreUpdate: validateSchema(centreUpdateSchema),
};
