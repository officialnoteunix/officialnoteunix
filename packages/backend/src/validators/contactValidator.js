import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').max(200),
  topic: z.string().max(200).optional().default(''),
  message: z.string().min(1, 'Message is required').max(5000),
});
