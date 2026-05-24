import { Router } from 'express';
import { authRouter } from './modules/auth/index.js';
import { uploadRouter } from './modules/upload/index.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/upload', uploadRouter);

export { router };
