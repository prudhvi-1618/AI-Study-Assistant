import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { redis } from '../redis/redis.js';
import type { JwtPayload, TokenPair } from '../types/common.types.js';

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateTokenPair = (userId: string, email: string, plan: string): TokenPair => {
  const jti = crypto.randomUUID();
  const payload = { userId, email, plan, jti };

  const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as any,
  });

  const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as any,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload & { exp: number } => {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload & { exp: number };
};

export const verifyRefreshToken = (token: string): JwtPayload & { exp: number } => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload & { exp: number };
};

export const blacklistToken = async (jti: string, exp: number): Promise<void> => {
  const now = Math.floor(Date.now() / 1000);
  const ttl = exp - now;
  if (ttl > 0) {
    await redis.setex(`blacklist:${jti}`, ttl, '1');
  }
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${jti}`);
  return result !== null;
};
