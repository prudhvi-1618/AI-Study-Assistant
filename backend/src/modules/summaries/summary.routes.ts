import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { AppError } from '../../shared/errors/AppError.js';
import { SummaryController } from './summary.controller.js';

const router = Router();
const controller = new SummaryController();

const generationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many summary generation requests. Please try again after an hour.',
  },
  keyGenerator: (req: any) => req.user?.userId || ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
});

const validateBody = (schema: z.ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new AppError('Validation failed', 400);
  }
  req.body = result.data as any;
  next();
};

const validateQuery = (schema: z.ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw new AppError('Validation failed', 400);
  }
  req.query = result.data as any;
  next();
};

const validateParams = (schema: z.ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw new AppError('Validation failed', 400);
  }
  req.params = result.data as any;
  next();
};

const generateSummarySchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(5),
  roomId: z.string().uuid().optional(),
  type: z.enum(['full', 'section', 'compare', 'revision_notes']).default('full'),
  sectionTopic: z.string().max(200).optional(),
  focusTopics: z.array(z.string().max(100)).max(10).optional(),
  subject: z.string().max(255).optional(),
  forceRegenerate: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.type === 'section' && !data.sectionTopic) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'sectionTopic is required when type is section',
    });
  }
});

const listSummariesSchema = z.object({
  roomId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  type: z.enum(['full', 'section', 'compare', 'revision_notes']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const paramIdSchema = z.object({ summaryId: z.string().uuid('Invalid summary ID') });
const documentIdSchema = z.object({ documentId: z.string().uuid('Invalid document ID') });

router.use(authenticate as RequestHandler);

router.post('/generate', generationRateLimiter, validateBody(generateSummarySchema), controller.generate as any);
router.get('/', validateQuery(listSummariesSchema), controller.list as any);
router.get('/document/:documentId', validateParams(documentIdSchema), controller.getForDocument as any);
router.get('/:summaryId', validateParams(paramIdSchema), controller.get as any);
router.delete('/:summaryId', validateParams(paramIdSchema), controller.delete as any);

export default router;
