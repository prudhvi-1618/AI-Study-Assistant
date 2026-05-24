import { Queue } from 'bullmq';
import { redis } from '../../shared/redis/redis.js';
import type { IngestionJobPayload } from './upload.types.js';
import { logger } from '../../shared/logger/logger.js';

export const INGESTION_QUEUE_NAME = 'document-ingestion';

export const ingestionQueue = new Queue<IngestionJobPayload>(INGESTION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

export async function closeIngestionQueue(): Promise<void> {
  await ingestionQueue.close();
  logger.info('Ingestion queue closed');
}
