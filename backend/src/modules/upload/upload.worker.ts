import { Worker, Job } from 'bullmq';
import { redis } from '../../shared/redis/redis.js';
import { logger } from '../../shared/logger/logger.js';
import { db } from '../../shared/db/mysql.js';
import { processDocument } from './upload.processor.js';
import type { IngestionJobPayload } from './upload.types.js';
import { INGESTION_QUEUE_NAME } from './upload.queue.js';
import { env } from '../../config/env.js';

let worker: Worker<IngestionJobPayload> | null = null;

async function processJob(job: Job<IngestionJobPayload>): Promise<void> {
  const { documentId } = job.data;
  const startTime = Date.now();

  logger.info('Processing started', { documentId, jobId: job.id, attempt: job.attemptsMade });

  try {
    // Step 1: Update status to processing
    await db.query(
      'UPDATE documents SET status = ?, updated_at = NOW() WHERE id = ?',
      ['processing', documentId]
    );

    // Step 2: Report progress 10%
    await job.updateProgress(10);

    // Step 3: Call processDocument
    const result = await processDocument(job.data, async (percent) => {
      await job.updateProgress(percent);
    });

    // Step 4: Update status to ready
    await db.query(
      'UPDATE documents SET status = ?, chunk_count = ?, page_count = ?, updated_at = NOW() WHERE id = ?',
      ['ready', result.chunkCount, result.pageCount, documentId]
    );

    // Step 5: Report progress 100%
    await job.updateProgress(100);

    logger.info('Ingestion complete', {
      documentId,
      chunkCount: result.chunkCount,
      pageCount: result.pageCount,
      durationMs: Date.now() - startTime,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Ingestion failed', error, { documentId, attempt: job.attemptsMade });

    // Update status to failed
    await db.query(
      'UPDATE documents SET status = ?, error_msg = ?, updated_at = NOW() WHERE id = ?',
      ['failed', errorMsg, documentId]
    );

    // Re-throw so BullMQ retry logic activates
    throw error;
  }
}

export function startIngestionWorker(): Worker<IngestionJobPayload> {
  if (worker) return worker;

  worker = new Worker<IngestionJobPayload>(
    INGESTION_QUEUE_NAME,
    processJob,
    {
      connection: redis,
      concurrency: Number(env.BULLMQ_CONCURRENCY) || 3,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed after all retries or with final error`, err, {
      attempts: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Ingestion worker error', err);
  });

  worker.on('stalled', (jobId) => {
    logger.warn(`Job ${jobId} stalled`);
  });

  return worker;
}

export async function closeIngestionWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Ingestion worker closed');
  }
}
