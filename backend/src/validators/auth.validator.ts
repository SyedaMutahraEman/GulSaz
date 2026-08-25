import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Valid email is required').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'employee', 'ADMIN', 'EMPLOYEE']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
