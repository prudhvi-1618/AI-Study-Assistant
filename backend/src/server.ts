import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './shared/db/mysql.js';
import { redis } from './shared/redis/redis.js';
import { logger } from './shared/logger/logger.js';
import { runMigrations } from './shared/db/migrate.js';
import type { Server } from 'node:http';
import { startIngestionWorker, closeIngestionWorker, closeIngestionQueue } from './modules/upload/index.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

let server: Server;

const startServer = async () => {
  try {
    // 1. Verify DB Connection
    logger.info('Verifying database connection...');
    const dbConnection = await pool.getConnection();
    logger.info('Database connection established successfully');
    dbConnection.release();

    // 2. Run Database Migrations
    logger.info('Running database migrations...');
    await runMigrations();
    logger.info('Database migrations completed');

    // 3. Verify Redis Connection
    logger.info('Verifying Redis connection...');
    await redis.connect();
    await redis.ping();
    logger.info('Redis connection verified successfully');

    // 3. Start Express Server
    server = app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Start BullMQ background ingestion worker
    startIngestionWorker();
    logger.info('Ingestion worker started');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown helper
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        // Close ingestion worker and queue
        await closeIngestionWorker();
        await closeIngestionQueue();
        logger.info('Ingestion worker and queue closed.');
        // Close Redis client
        await redis.quit();
        logger.info('Redis connection closed.');
        // Close MySQL pool
        await pool.end();
        logger.info('Database connection pool closed.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
