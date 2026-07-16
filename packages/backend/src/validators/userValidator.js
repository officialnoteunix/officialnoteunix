import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullname: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
