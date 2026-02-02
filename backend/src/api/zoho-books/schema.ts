import { z, validateSchema } from '../../utils/validate';

const generateTokenSchema = z
  .object({
    code: z.string().trim().min(2).max(250),
    clientId: z.string().trim().min(2).max(250),
    clientSecret: z.string().trim().max(250).optional(),
    domain: z.string().trim().min(2).max(10),
  })
  .strict();

export default {
  generateToken: validateSchema(generateTokenSchema),
};
