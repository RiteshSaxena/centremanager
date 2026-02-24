import { z, validateSchema } from '../../utils/validate';

const createChildSchema = z
  .object({
    firstName: z.string().trim().min(1).max(250),
    lastName: z.string().trim().max(250).optional(),
    gender: z.enum(['Male', 'Female', 'Others']).optional(),
    houseNumber: z.string().trim().max(250).optional(),
    streetName: z.string().trim().max(250).optional(),
    city: z.string().trim().max(250).optional(),
    postcode: z.string().trim().max(20).optional(),
    schoolYear: z.string().trim().max(50).optional(),
    status: z
      .enum([
        'New',
        'No Further Contact',
        'Future Follow Up',
        'Enrolment meeting no show',
        "Attended enrolment meeting but didn't enrol",
        'Send to KSiS',
        'Send to KSiS (Free Trial)',
        'Exited',
      ])
      .optional(),
    enrollmentDate: z.string().optional().nullable(),
    enquiryDate: z.string().optional().nullable(),
    formType: z.string().trim().max(100).optional(),
    referralCode: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
    paymentDate: z.number().min(1).max(31).optional().nullable(),
    paymentAmount: z.number().optional().nullable(),
    isEarlyLearner: z.boolean().optional(),
    subjects: z.array(z.number()).optional(),
    parents: z.array(z.number()).optional(),
    school: z.number().optional().nullable(),
    slots: z.array(z.number()).optional(),
    isDue: z.boolean().optional(),
    dueAmount: z.number().optional().nullable(),
  })
  .strict();

const updateChildSchema = createChildSchema.partial();

export default {
  createChild: validateSchema(createChildSchema),
  updateChild: validateSchema(updateChildSchema),
};
