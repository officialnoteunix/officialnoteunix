import { z } from 'zod';

export const createContentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  title: z.string().max(200).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  code: z.string().max(50).optional().default(''),
});

export const updateContentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  code: z.string().max(50).optional(),
});

export const createAdSchema = z.object({
  slot: z.enum(['marquee', 'sidebar', 'in_content'], { required_error: 'Slot is required' }),
  imageUrl: z.string().url('Must be a valid URL'),
  linkUrl: z.string().optional().default(''),
  description: z.string().max(500).optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  active: z.boolean().optional().default(true),
});

export const updateAdSchema = z.object({
  slot: z.enum(['marquee', 'sidebar', 'in_content']).optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  linkUrl: z.string().optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().optional(),
});
