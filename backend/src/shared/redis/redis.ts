import { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('Connected to Redis successfully');
});

redis.on('error', (err: unknown) => {
  logger.error('Redis connection error', err);
});
