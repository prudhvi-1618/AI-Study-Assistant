import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/common.types.js';
import { sendResponse } from '../../shared/utils/response.js';
import { QuizService } from './quiz.service.js';

const quizService = new QuizService();

export class QuizController {

  generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await quizService.generateQuiz({
        userId: req.user.userId,
        ...req.body,
      });
      sendResponse.success(res, 201, 'Quiz generated', result);
    } catch (error) {
      next(error);
    }
  };

  listQuizzes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.query.roomId as string | undefined;
      const quizzes = await quizService.listQuizzes(req.user.userId, roomId);
      sendResponse.success(res, 200, 'Quizzes retrieved successfully', { quizzes });
    } catch (error) {
      next(error);
    }
  };

  startAttempt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await quizService.startAttempt(req.params.quizId as string, req.user.userId);
      sendResponse.success(res, 201, 'Attempt started', result);
    } catch (error) {
      next(error);
    }
  };

  submitAnswer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await quizService.submitAnswer({
        attemptId: req.params.attemptId as string,
        userId: req.user.userId,
        ...req.body,
      });
      sendResponse.success(res, 200, 'Answer submitted successfully', result);
    } catch (error) {
      next(error);
    }
  };

  completeAttempt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await quizService.completeAttempt(req.params.attemptId as string, req.user.userId);
      sendResponse.success(res, 200, 'Quiz attempt completed', result);
    } catch (error) {
      next(error);
    }
  };

  abandonAttempt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await quizService.abandonAttempt(req.params.attemptId as string, req.user.userId);
      sendResponse.success(res, 200, 'Attempt abandoned');
    } catch (error) {
      next(error);
    }
  };

  getAttemptResult = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await quizService.getAttemptResult(req.params.attemptId as string, req.user.userId);
      sendResponse.success(res, 200, 'Attempt result retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await quizService.getHistory(req.user.userId);
      sendResponse.success(res, 200, 'Quiz history retrieved successfully', { history });
    } catch (error) {
      next(error);
    }
  };

  getWeakAreas = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const syllabusId = req.query.syllabusId as string | undefined;
      const areas = await quizService.getWeakAreas(req.user.userId, syllabusId);
      sendResponse.success(res, 200, 'Weak areas retrieved successfully', { weakAreas: areas });
    } catch (error) {
      next(error);
    }
  };
}
