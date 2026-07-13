import { z } from 'zod';

export const createNoteSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});
