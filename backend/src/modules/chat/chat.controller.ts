import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/common.types.js';
import { ChatService } from './chat.service.js';
import { sendResponse } from '../../shared/utils/response.js';
import { logger } from '../../shared/logger/logger.js';
import type { SSETokenEvent, SSEDoneEvent, SSEErrorEvent } from './chat.types.js';

const chatService = new ChatService();

export class ChatController {
  createSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any).userId as string;
      const session = await chatService.createSession(userId, req.body);
      sendResponse.success(res, 201, 'Session created', session);
    } catch (error) {
      next(error);
    }
  };

  listSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any).userId as string;
      const result = await chatService.listSessions(userId, req.query as any);
      sendResponse.success(res, 200, 'Sessions retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = (req.user as any).userId as string;
      const result = await chatService.getSession(sessionId, userId);
      sendResponse.success(res, 200, 'Session retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const sessionId = req.params.sessionId as string;
    const userId = (req.user as any).userId as string;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const writeEvent = (event: SSETokenEvent | SSEDoneEvent | SSEErrorEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    let isDisconnected = false;
    req.on('close', () => {
      isDisconnected = true;
      logger.debug('SSE client disconnected', { sessionId, userId });
    });

    try {
      await chatService.sendMessage(
        sessionId,
        userId,
        req.body,
        (token: string) => {
          if (!isDisconnected) {
            writeEvent({ type: 'token', token });
          }
        },
        (result) => {
          if (!isDisconnected) {
            writeEvent({
              type: 'done',
              messageId: randomUUID(),
              sources: result.sources,
              tokensUsed: result.tokensUsed,
            });
          }
          res.end();
        },
        (error: Error) => {
          if (!isDisconnected) {
            writeEvent({ type: 'error', message: error.message });
          }
          res.end();
        }
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (error instanceof Error) {
        logger.error('Chat sendMessage failed', error, { sessionId, userId });
      } else {
        logger.error('Chat sendMessage failed', { sessionId, userId, error });
      }
      if (!isDisconnected) {
        writeEvent({ type: 'error', message: msg });
      }
      res.end();
    }
  };

  getMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 30;
      const sessionId = req.params.sessionId as string;
      const userId = (req.user as any).userId as string;
      const result = await chatService.getMessages(sessionId, userId, page, limit);
      sendResponse.success(res, 200, 'Messages retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  deleteSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = (req.user as any).userId as string;
      await chatService.deleteSession(sessionId, userId);
      sendResponse.success(res, 200, 'Session deleted');
    } catch (error) {
      next(error);
    }
  };

  archiveSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = (req.user as any).userId as string;
      await chatService.archiveSession(sessionId, userId);
      sendResponse.success(res, 200, 'Session archived');
    } catch (error) {
      next(error);
    }
  };

  unarchiveSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = (req.user as any).userId as string;
      await chatService.unarchiveSession(sessionId, userId);
      sendResponse.success(res, 200, 'Session unarchived');
    } catch (error) {
      next(error);
    }
  };

  clearMemory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = (req.user as any).userId as string;
      await chatService.clearSessionMemory(sessionId, userId);
      sendResponse.success(res, 200, 'Memory cleared and rebuilt from history');
    } catch (error) {
      next(error);
    }
  };
}
