import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { db } from '../../shared/db/mysql.js';
import { redis } from '../../shared/redis/redis.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';
import { env } from '../../config/env.js';
import {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  blacklistToken,
} from '../../shared/utils/token.js';
import type { RegisterDTO, LoginDTO, AuthResponse, UserResponse } from './auth.types.js';
import type { TokenPair } from '../../shared/types/common.types.js';

export class AuthService {
  private async getUserById(userId: string): Promise<UserResponse> {
    const users = await db.query<UserResponse[]>(
      'SELECT id, email, name, plan, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  public async register(
    dto: RegisterDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const existingUsers = await db.query<{ id: number }[]>(
      'SELECT id FROM users WHERE email = ?',
      [dto.email]
    );
    if (existingUsers.length > 0) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);
    const plan = dto.plan || 'free';

    const userId = randomUUID();
    await db.query(
      'INSERT INTO users (id, email, password_hash, name, plan) VALUES (?, ?, ?, ?, ?)',
      [userId, dto.email, passwordHash, dto.name, plan]
    );

    const tokens = generateTokenPair(userId, dto.email, plan);
    const decoded = verifyRefreshToken(tokens.refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    const tokenHash = hashToken(tokens.refreshToken);

    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [decoded.jti, userId, tokenHash, randomUUID(), userAgent || null, ipAddress || null, expiresAt]
    );

    const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      await redis.setex(`refresh_token:${decoded.jti}`, ttlSeconds, tokenHash);
    }

    const user = await this.getUserById(userId);

    logger.info(`User registered successfully: ${dto.email}`, { userId, ipAddress, userAgent });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async login(dto: LoginDTO, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const users = await db.query<
      (UserResponse & { password_hash?: string })[]
    >('SELECT * FROM users WHERE email = ?', [dto.email]);
    const user = users[0];
    console.log(user);
    const passwordHash = user ? user.password_hash || '' : '';
    const isMatch = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = generateTokenPair(user.id, user.email, user.plan);
    const decoded = verifyRefreshToken(tokens.refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    const tokenHash = hashToken(tokens.refreshToken);

    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [decoded.jti, user.id, tokenHash, randomUUID(), userAgent || null, ipAddress || null, expiresAt]
    );

    const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      await redis.setex(`refresh_token:${decoded.jti}`, ttlSeconds, tokenHash);
    }

    const userProfile = await this.getUserById(user.id);

    logger.info(`User logged in successfully: ${dto.email}`, { userId: user.id, ipAddress, userAgent });

    return {
      user: userProfile,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const incomingHash = hashToken(refreshToken);

    const isUsed = await redis.get(`used_jti:${payload.jti}`);
    if (isUsed) {
      logger.warn(`Token reuse detected for user ${payload.userId}! Revoking all sessions.`, {
        userId: payload.userId,
        jti: payload.jti,
        ipAddress,
        userAgent,
      });

      const activeSessions = await db.query<{ id: string }[]>(
        'SELECT id FROM refresh_tokens WHERE user_id = ?',
        [payload.userId]
      );
      for (const session of activeSessions) {
        await redis.del(`refresh_token:${session.id}`);
      }
      await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [payload.userId]);

      throw new AppError('Token reuse detected. All active sessions have been revoked.', 403);
    }

    const storedTokens = await db.query<{ token_hash: string }[]>(
      'SELECT token_hash FROM refresh_tokens WHERE id = ?',
      [payload.jti]
    );
    const storedToken = storedTokens[0];

    if (!storedToken || storedToken.token_hash !== incomingHash) {
      throw new AppError('Invalid refresh token.', 401);
    }

    const tokens = generateTokenPair(payload.userId, payload.email, payload.plan);
    const decoded = verifyRefreshToken(tokens.refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    const tokenHash = hashToken(tokens.refreshToken);

    const now = Math.floor(Date.now() / 1000);
    const oldRemainingTtl = payload.exp - now;
    if (oldRemainingTtl > 0) {
      await redis.setex(`used_jti:${payload.jti}`, oldRemainingTtl, '1');
    }

    await db.query('DELETE FROM refresh_tokens WHERE id = ?', [payload.jti]);
    await redis.del(`refresh_token:${payload.jti}`);

    await db.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [decoded.jti, payload.userId, tokenHash, randomUUID(), userAgent || null, ipAddress || null, expiresAt]
    );

    const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      await redis.setex(`refresh_token:${decoded.jti}`, ttlSeconds, tokenHash);
    }

    logger.info(`Token rotated successfully for user ${payload.userId}`, {
      userId: payload.userId,
      ipAddress,
      userAgent,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  public async logout(accessToken: string, refreshToken?: string): Promise<void> {
    let payload;
    try {
      payload = verifyAccessToken(accessToken);
    } catch {
      try {
        const decoded = jwt.decode(accessToken) as any;
        if (decoded && decoded.jti) {
          payload = decoded;
        }
      } catch {
        // Ignore
      }
    }

    if (payload && payload.jti) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp > now) {
        await blacklistToken(payload.jti, payload.exp);
      }
      await db.query('DELETE FROM refresh_tokens WHERE id = ?', [payload.jti]);
      await redis.del(`refresh_token:${payload.jti}`);
    }

    if (refreshToken) {
      try {
        const decodedRefresh = verifyRefreshToken(refreshToken);
        await db.query('DELETE FROM refresh_tokens WHERE id = ?', [decodedRefresh.jti]);
        await redis.del(`refresh_token:${decodedRefresh.jti}`);
      } catch {
        // Ignore
      }
    }
  }

  public async getMe(userId: string): Promise<UserResponse> {
    return this.getUserById(userId);
  }
}
