import { Router, type RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { ChatController } from './chat.controller.js';
import {
  validate,
  createSessionSchema,
  sendMessageSchema,
  listSessionsSchema,
  getMessagesSchema,
  sessionIdSchema,
} from './chat.validator.js';

const router = Router();
const controller = new ChatController();

const messageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many messages. Please try again in a minute.',
  },
  keyGenerator: (req: any) => req.user?.userId || ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate as RequestHandler);

router.post('/sessions', validate(createSessionSchema), controller.createSession as any);
router.get('/sessions', validate(listSessionsSchema, 'query'), controller.listSessions as any);
router.get('/sessions/:sessionId', validate(sessionIdSchema, 'params'), controller.getSession as any);
router.delete('/sessions/:sessionId', validate(sessionIdSchema, 'params'), controller.deleteSession as any);
router.patch('/sessions/:sessionId/archive', validate(sessionIdSchema, 'params'), controller.archiveSession as any);
router.patch('/sessions/:sessionId/unarchive', validate(sessionIdSchema, 'params'), controller.unarchiveSession as any);
router.post('/sessions/:sessionId/messages', validate(sessionIdSchema, 'params'), validate(sendMessageSchema, 'body'), messageRateLimiter, controller.sendMessage as any);
router.get('/sessions/:sessionId/messages', validate(sessionIdSchema, 'params'), validate(getMessagesSchema, 'query'), controller.getMessages as any);
router.delete('/sessions/:sessionId/memory', validate(sessionIdSchema, 'params'), controller.clearMemory as any);

export default router;
