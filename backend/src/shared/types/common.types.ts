import type { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  plan: string;
  jti: string;
  exp?: number;
  iat?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface OptionalAuthenticatedRequest extends Request {
  user?: JwtPayload;
}
