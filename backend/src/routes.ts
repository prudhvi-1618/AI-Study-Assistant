import { Router } from 'express';
import { authRouter } from './modules/auth/index.js';
import { uploadRouter } from './modules/upload/index.js';
import { flashcardRouter } from './modules/flashcards/index.js';
import { quizRouter } from './modules/quiz/index.js';
import { chatRouter } from './modules/chat/index.js';
import { summaryRouter } from './modules/summaries/index.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/flashcards', flashcardRouter);
router.use('/quiz', quizRouter);
router.use('/chat', chatRouter);
router.use('/summaries', summaryRouter);

export { router };
