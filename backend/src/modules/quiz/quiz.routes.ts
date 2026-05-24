import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { QuizController } from './quiz.controller.js';

const router = Router();
const controller = new QuizController();

// Rate limiter: 10 quiz generation requests per hour per user
const generationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many quiz generation requests. Please try again after an hour.',
  },
  keyGenerator: (req: any) => req.user?.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware for request body validation
const validateBody = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }
  req.body = result.data;
  next();
};

// Zod schemas
const generateQuizSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(10),
  roomId: z.string().uuid().optional(),
  count: z.number().int().min(3).max(30).default(10),
  difficultyMix: z.object({
    easy: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    hard: z.number().min(0).max(100),
  })
    .refine(m => m.easy + m.medium + m.hard === 100, {
      message: 'Difficulty mix percentages must sum to 100',
    })
    .default({ easy: 30, medium: 50, hard: 20 }),
  topicFocus: z.string().max(200).optional().nullable(),
  isAdaptive: z.boolean().default(false),
  syllabusId: z.string().uuid().optional(),
});

const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  userAnswer: z.enum(['A', 'B', 'C', 'D']).nullable(),
  timeTakenS: z.number().int().positive().optional(),
});

// Apply JWT authentication to all routes
router.use(authenticate as any);

// Routes
router.post('/generate', generationRateLimiter, validateBody(generateQuizSchema), controller.generate as any);
router.get('/', controller.listQuizzes as any);
router.post('/:quizId/attempt', controller.startAttempt as any);
router.post('/attempts/:attemptId/answer', validateBody(submitAnswerSchema), controller.submitAnswer as any);
router.post('/attempts/:attemptId/complete', controller.completeAttempt as any);
router.post('/attempts/:attemptId/abandon', controller.abandonAttempt as any);
router.get('/attempts/:attemptId/result', controller.getAttemptResult as any);
router.get('/history', controller.getHistory as any);
router.get('/weak-areas', controller.getWeakAreas as any);

export default router;
