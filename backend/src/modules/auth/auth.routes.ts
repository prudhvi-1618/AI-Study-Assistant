import { Router } from 'express';
import { register, login, refresh, logout, getMe } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
import { validate, registerSchema, loginSchema, refreshSchema } from './auth.validator.js';
import { authRateLimiter } from '../../shared/middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);
router.get('/me', authenticate as any, getMe as any);

export default router;
