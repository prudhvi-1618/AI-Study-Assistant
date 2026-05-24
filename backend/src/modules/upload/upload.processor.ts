import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';

import { env } from '../../config/env.js';
import { db } from '../../shared/db/mysql.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { splitText } from '../../ai/rag/chunking.js';
import { embedTexts } from '../../ai/rag/embeddings.js';
import { upsertPoints, deletePointsByFilter } from '../../ai/rag/vectorStore.js';
import type { IngestionJobPayload, ProcessingResult, ProcessedChunk } from './upload.types.js';

export async function processDocument(
  payload: IngestionJobPayload,
  onProgress: (percent: number) => Promise<void>
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const { documentId, s3Key, fileType, filename } = payload;
  const absolutePath = path.resolve(process.cwd(), s3Key);

  try {
    // Step A — Read from Local Filesystem (progress: 15%)
    logger.info('Reading file from local storage', { documentId, s3Key });
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(absolutePath);
    } catch (readErr) {
      throw new AppError(`Storage file not accessible: ${s3Key}`, 502);
    }
    logger.info('Read from local storage', { documentId, s3Key, bytes: buffer.length });
    await onProgress(15);

    // Step B — Parse to text (progress: 30%)
    let pageTexts: string[] = [];
    let parsedPageCount: number | null = null;

    try {
      if (fileType === 'pdf') {
        const parser = new PDFParse({ data: buffer });
        try {
          const result = await parser.getText();
          pageTexts = result.pages.map((page: any) => page.text);
          parsedPageCount = result.total;
        } finally {
          await parser.destroy();
        }
      } else if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        pageTexts = [result.value];
        parsedPageCount = null;
      } else if (fileType === 'txt' || fileType === 'md') {
        pageTexts = [buffer.toString('utf-8')];
        parsedPageCount = null;
      } else if (fileType === 'pptx') {
        const loader = new PPTXLoader(absolutePath);
        const docs = await loader.load();
        pageTexts = docs.map(doc => doc.pageContent);
        parsedPageCount = docs.length;
      } else {
        throw new AppError(`Unsupported file type: ${fileType}`, 422);
      }
    } catch (parseErr: any) {
      if (parseErr instanceof AppError) throw parseErr;
      throw new AppError(`Could not parse document: ${filename}`, 422);
    }

    if (pageTexts.length === 0 || pageTexts.every(t => !t || !t.trim())) {
      throw new AppError(`Could not parse document: ${filename} (no text content extracted)`, 422);
    }

    await onProgress(30);

    // Step C — Split into chunks (progress: 50%)
    const chunks: ProcessedChunk[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < pageTexts.length; i++) {
      const textVal = pageTexts[i];
      if (!textVal || !textVal.trim()) continue;

      const pageChunks = await splitText(textVal, { chunkSize: 1000, chunkOverlap: 200 });
      const pageNum = parsedPageCount !== null ? i + 1 : null;

      for (const content of pageChunks) {
        chunks.push({
          id: crypto.randomUUID(),
          content,
          page_number: pageNum,
          chunk_index: chunkIndex++,
          token_count: Math.ceil(content.length / 4), // rough English token estimation
        });
      }
    }

    if (chunks.length === 0) {
      throw new AppError(`Could not parse document: ${filename} (zero chunks created)`, 422);
    }

    logger.debug('Pipeline step complete', { documentId, step: 'chunking', chunks: chunks.length });
    await onProgress(50);

    // Step D — Generate embeddings (progress: 70%)
    const textsToEmbed = chunks.map(c => c.content);
    const embeddings = await embedTexts(textsToEmbed);
    await onProgress(70);

    // Step E — Store in Qdrant (progress: 85%)
    const points = chunks.map((chunk, idx) => {
      const embedding = embeddings[idx];
      if (!embedding) {
        throw new AppError('Generated embedding missing for chunk', 500);
      }
      return {
        id: chunk.id,
        vector: embedding,
        payload: {
          chunk_id: chunk.id,
          document_id: documentId,
          user_id: payload.userId,
          room_id: payload.roomId,
          page_number: chunk.page_number,
          chunk_index: chunk.chunk_index,
          filename: payload.filename,
        },
      };
    });

    await upsertPoints(env.QDRANT_COLLECTION_NAME, points);
    await onProgress(85);

    // Step F — Store chunk metadata in MySQL (progress: 95%)
    try {
      const batchSize = 50;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())').join(', ');
        const values = batch.flatMap(chunk => [
          chunk.id,
          documentId,
          payload.userId,
          payload.roomId,
          chunk.chunk_index,
          chunk.content,
          chunk.page_number,
          chunk.token_count,
          env.EMBEDDING_MODEL,
        ]);

        await db.query(
          `INSERT INTO document_chunks
            (id, document_id, user_id, room_id, chunk_index, content,
             page_number, token_count, embedding_model, created_at)
           VALUES ${placeholders}`,
          values
        );
      }
    } catch (mysqlError) {
      logger.error('MySQL chunks insert failed, rolling back Qdrant points', { documentId });
      try {
        await deletePointsByFilter(env.QDRANT_COLLECTION_NAME, { document_id: documentId });
      } catch (rollbackError) {
        logger.error('Qdrant rollback failed', rollbackError, { documentId });
      }
      throw mysqlError;
    }

    await onProgress(100);

    return {
      chunkCount: chunks.length,
      pageCount: parsedPageCount,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Processing failed', error, { documentId });
    throw error;
  }
}
