import type { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest, OptionalAuthenticatedRequest } from '../types/common.types.js';
import { verifyAccessToken, isTokenBlacklisted } from '../utils/token.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing or malformed token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication required. Missing token.', 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid token';
      throw new AppError(`Unauthorized: ${msg}`, 401);
    }

    const blacklisted = await isTokenBlacklisted(payload.jti);
    if (blacklisted) {
      throw new AppError('Unauthorized: Token has been revoked', 401);
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: OptionalAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      const blacklisted = await isTokenBlacklisted(payload.jti);
      if (!blacklisted) {
        req.user = payload;
      }
    } catch {
      // Ignore errors for optional authentication
    }

    next();
  } catch (error) {
    next(error);
  }
};
