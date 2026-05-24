import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/common.types.js';
import { SummaryService } from './summary.service.js';
import { sendResponse } from '../../shared/utils/response.js';

const summaryService = new SummaryService();

export class SummaryController {
  generate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any).userId as string;
      const result = await summaryService.generateSummary({
        userId,
        ...req.body,
      });
      const status = result.fromCache ? 200 : 201;
      const message = result.fromCache ? 'Summary retrieved from cache' : 'Summary generated';
      sendResponse.success(res, status, message, result);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any).userId as string;
      const result = await summaryService.listSummaries(userId, req.query as any);
      sendResponse.success(res, 200, 'Summaries retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summaryId = req.params.summaryId as string;
      const userId = (req.user as any).userId as string;
      const summary = await summaryService.getSummary(summaryId, userId);
      sendResponse.success(res, 200, 'Summary retrieved', summary);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summaryId = req.params.summaryId as string;
      const userId = (req.user as any).userId as string;
      await summaryService.deleteSummary(summaryId, userId);
      sendResponse.success(res, 200, 'Summary deleted');
    } catch (error) {
      next(error);
    }
  };

  getForDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any).userId as string;
      const documentId = req.params.documentId as string;
      const type = ((req.query.type as string) ?? 'full') as any;
      const result = await summaryService.getOrGenerate({
        userId,
        documentId,
        type,
        maxAgeHours: 24,
      });
      sendResponse.success(res, 200, result.isNew ? 'Summary generated' : 'Summary retrieved', result);
    } catch (error) {
      next(error);
    }
  };
}
