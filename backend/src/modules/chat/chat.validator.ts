import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError.js';

export const createSessionSchema = z.object({
  roomId: z.string().uuid().optional(),
  title: z.string().max(255).optional(),
  documentIds: z.array(z.string().uuid()).max(10).optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(4000, 'Message too long'),
  documentIds: z.array(z.string().uuid()).max(10).optional(),
});

export const listSessionsSchema = z.object({
  roomId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const getMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export const validate = <T extends z.ZodSchema>(schema: T, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = (req as unknown as Record<string, unknown>)[source];
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new AppError('Validation failed', 400);
    }

    // Some Express request properties (notably `req.query`) are implemented
    // with getters and cannot be reassigned directly at runtime. To avoid the
    // "Cannot set property ... which has only a getter" error, merge the
    // validated data into the existing object instead of replacing it when
    // the target is `query`.
    if (source === 'query') {
      const target = req.query as Record<string, unknown> | undefined;
      if (target && typeof target === 'object') {
        Object.assign(target, result.data as Record<string, unknown>);
      } else {
        // Fallback: if req.query is not an object, attach a new object to a
        // symbol-keyed property to avoid clobbering the request prototype.
        (req as any).query = result.data;
      }
    } else {
      (req as unknown as Record<string, unknown>)[source] = result.data as any;
    }
    next();
  };
};
