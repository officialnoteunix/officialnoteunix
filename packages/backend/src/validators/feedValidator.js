import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().trim().max(2000, 'Post is too long').optional().default(''),
  visibility: z.enum(['public', 'followers']).optional().default('public'),
  tags: z.array(z.string().trim().max(24)).max(10, 'Too many tags').optional().default([]),
  topic: z.string().trim().max(40).optional().default(''),
}).refine((data) => data.content.length > 0 || (data.media && data.media.length > 0), {
  message: 'Post must have text or at least one media file',
  path: ['content'],
});

export const updatePostSchema = z.object({
  content: z.string().trim().max(2000).optional(),
  visibility: z.enum(['public', 'followers']).optional(),
  tags: z.array(z.string().trim().max(24)).max(10).optional(),
  topic: z.string().trim().max(40).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

export const updateProfileSchema = z.object({
  username: z.string().trim().regex(/^[a-z0-9_]{3,20}$/, 'Username must be 3-20 chars: lowercase letters, numbers, underscore').optional(),
  bio: z.string().trim().max(160).optional(),
});
