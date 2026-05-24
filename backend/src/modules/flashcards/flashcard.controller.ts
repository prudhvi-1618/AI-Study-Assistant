import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/common.types.js';
import { sendResponse } from '../../shared/utils/response.js';
import { FlashcardService } from './flashcard.service.js';

const flashcardService = new FlashcardService();

export class FlashcardController {

  generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await flashcardService.generateDeck({
        userId: req.user.userId,
        ...req.body,
      });
      sendResponse.success(res, 201, 'Flashcard deck generated', result);
    } catch (error) {
      next(error);
    }
  };

  listDecks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.query.roomId as string | undefined;
      const decks = await flashcardService.listDecks(req.user.userId, roomId);
      sendResponse.success(res, 200, 'Decks retrieved successfully', { decks });
    } catch (error) {
      next(error);
    }
  };

  getDeck = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deck = await flashcardService.getDeck(req.params.deckId as string, req.user.userId);
      sendResponse.success(res, 200, 'Deck retrieved successfully', deck);
    } catch (error) {
      next(error);
    }
  };

  reviewCard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await flashcardService.reviewCard({
        cardId: req.params.cardId as string,
        userId: req.user.userId,
        result: req.body.result,
      });
      sendResponse.success(res, 200, 'Review recorded', result);
    } catch (error) {
      next(error);
    }
  };

  getDueCards = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const cards = await flashcardService.getDueCards(req.user.userId, limit);
      sendResponse.success(res, 200, 'Due cards retrieved successfully', { cards, count: cards.length });
    } catch (error) {
      next(error);
    }
  };

  explainCard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await flashcardService.explainCard(req.params.cardId as string, req.user.userId);
      sendResponse.success(res, 200, 'Explanation retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  deleteDeck = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await flashcardService.deleteDeck(req.params.deckId as string, req.user.userId);
      sendResponse.success(res, 200, 'Deck deleted');
    } catch (error) {
      next(error);
    }
  };
}
