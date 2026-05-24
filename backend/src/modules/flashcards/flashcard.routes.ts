import { Router } from 'express';
import { z } from 'zod';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { FlashcardController } from './flashcard.controller.js';

const router = Router();
const controller = new FlashcardController();

// Rate limiter: 10 requests per hour per user
const generationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many flashcard generation requests. Please try again after an hour.',
  },
  keyGenerator: (req: any) => req.user?.userId || ipKeyGenerator(req.ip),
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
const generateDeckSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(10),
  roomId: z.string().uuid().optional(),
  count: z.number().int().min(5).max(50).default(20),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  topicFocus: z.string().max(200).optional().nullable(),
});

const reviewCardSchema = z.object({
  result: z.enum(['correct', 'incorrect', 'skipped']),
});

// Apply JWT authentication to all routes
router.use(authenticate as any);

// Routes
router.post('/generate', generationRateLimiter, validateBody(generateDeckSchema), controller.generate as any);
router.get('/decks', controller.listDecks as any);
router.get('/decks/:deckId', controller.getDeck as any);
router.delete('/decks/:deckId', controller.deleteDeck as any);
router.get('/due', controller.getDueCards as any);
router.post('/cards/:cardId/review', validateBody(reviewCardSchema), controller.reviewCard as any);
router.get('/cards/:cardId/explain', controller.explainCard as any);

export default router;
