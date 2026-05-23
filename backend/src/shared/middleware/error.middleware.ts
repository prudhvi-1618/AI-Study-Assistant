import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../logger/logger.js';
import { sendResponse } from '../utils/response.js';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    sendResponse.error(res, err.statusCode, err.message);
    return;
  }

  logger.error(`Unhandled exception: ${err instanceof Error ? err.message : String(err)}`, err, {
    path: req.path,
    method: req.method,
  });

  const statusCode = 500;
  const message = process.env['NODE_ENV'] === 'production'
    ? 'Internal server error occurred'
    : err instanceof Error ? err.message : 'Internal server error';

  sendResponse.error(res, statusCode, message);
};
