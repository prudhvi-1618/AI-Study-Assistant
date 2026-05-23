import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../shared/errors/AppError.js';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password is too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  plan: z.enum(['free', 'pro']).optional().default('free'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(', ');
      next(new AppError(`Validation failed: ${errorMsg}`, 400));
      return;
    }
    req.body = result.data;
    next();
  };
};
