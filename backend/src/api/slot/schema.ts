import { z, validateSchema } from '../../utils/validate';

const createSlotSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid time format (HH:mm or HH:mm:ss)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Invalid time format (HH:mm or HH:mm:ss)'),
  })
  .strict();

const updateSlotSchema = createSlotSchema.partial();

export default {
  createSlot: validateSchema(createSlotSchema),
  updateSlot: validateSchema(updateSlotSchema),
};
