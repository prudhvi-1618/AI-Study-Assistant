import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const storage = multer.memoryStorage();

export const uploadMulter = multer({
  storage,
  limits: {
    fileSize: Number(env.MAX_FILE_SIZE_MB) * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 415));
      return;
    }
    cb(null, true);
  },
});

const multerUpload = uploadMulter.array('files', 5);

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(`File too large. Maximum size is ${env.MAX_FILE_SIZE_MB}MB`, 413));
        }
        return next(new AppError(err.message, 400));
      }
      return next(err);
    }
    next();
  });
};

export const listDocumentsSchema = z.object({
  roomId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'ready', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const documentIdSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
});

export const uploadBodySchema = z.object({
  roomId: z.string().uuid().optional(),
});

export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = JSON.stringify(result.error.flatten().fieldErrors);
      throw new AppError(`Validation failed: ${details}`, 400);
    }
    if (source === 'query' || source === 'params') {
      Object.defineProperty(req, source, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
};
