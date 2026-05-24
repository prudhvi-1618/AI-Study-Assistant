import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { env } from '../../config/env.js';
import { db } from '../../shared/db/mysql.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ingestionQueue } from './upload.queue.js';
import { deletePointsByFilter } from '../../ai/rag/vectorStore.js';
import type {
  DocumentRecord,
  FileType,
  ListDocumentsQuery,
  UploadResponse,
} from './upload.types.js';

const MIME_MAP: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

export class UploadService {
  async uploadDocument(
    fileBuffer: Buffer,
    originalFilename: string,
    mimetype: string,
    userId: string,
    roomId?: string
  ): Promise<UploadResponse> {
    const startTime = Date.now();

    // 1. Detect fileType from mimetype + extension
    let fileType: FileType | undefined = MIME_MAP[mimetype];
    if (!fileType) {
      const ext = originalFilename.split('.').pop()?.toLowerCase();
      if (ext && ['pdf', 'docx', 'txt', 'pptx', 'md'].includes(ext)) {
        fileType = ext as FileType;
      }
    }
    if (!fileType) {
      logger.warn('Upload rejected: Unsupported file type', { mimetype, originalFilename });
      throw new AppError(`Unsupported file type: ${mimetype}`, 415);
    }

    logger.info('Upload received', { userId, filename: originalFilename, fileType, sizeBytes: fileBuffer.length });

    // 2. Generate s3Key (local file path relative to process.cwd)
    const extName = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extName);
    const sanitizedBase = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const sanitizedFilename = `${sanitizedBase}${extName}`;
    
    const relativeDir = path.join('src', 'uploads', userId);
    const absoluteDir = path.resolve(process.cwd(), relativeDir);
    const relativePath = path.join(relativeDir, `${Date.now()}-${sanitizedFilename}`).replace(/\\/g, '/');
    const absolutePath = path.resolve(process.cwd(), relativePath);

    // 3. Write file locally
    try {
      await fs.mkdir(absoluteDir, { recursive: true });
      await fs.writeFile(absolutePath, fileBuffer);
    } catch (fsErr) {
      logger.error('Failed to write file locally', fsErr);
      throw new AppError('Storage service unavailable', 502);
    }

    const durationMs = Date.now() - startTime;
    const documentId = crypto.randomUUID();
    logger.info('S3 upload complete', { documentId, s3Key: relativePath, durationMs });

    // 4. INSERT into documents table
    try {
      await db.query(
        `INSERT INTO documents 
          (id, user_id, room_id, filename, s3_key, file_type, size_bytes, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
        [
          documentId,
          userId,
          roomId || null,
          originalFilename,
          relativePath,
          fileType,
          fileBuffer.length,
        ]
      );
    } catch (dbErr) {
      logger.error('Failed to save document metadata to database', dbErr);
      // cleanup written file
      await fs.unlink(absolutePath).catch(() => {});
      throw new AppError('Database service unavailable', 500);
    }

    // 5. Push to ingestionQueue
    try {
      await ingestionQueue.add(
        'ingest',
        {
          documentId,
          userId,
          roomId: roomId || null,
          s3Key: relativePath,
          fileType,
          filename: originalFilename,
        },
        {
          jobId: documentId,
        }
      );
      logger.info('Ingestion job enqueued', { documentId, jobId: documentId });
    } catch (queueErr) {
      logger.error('Failed to enqueue ingestion job', queueErr);
      // We keep the DB record but mark it as failed since queueing failed
      await db.query(
        'UPDATE documents SET status = ?, error_msg = ? WHERE id = ?',
        ['failed', 'Failed to enqueue processing job', documentId]
      );
      throw new AppError('Processing queue unavailable', 503);
    }

    return {
      documentId,
      filename: originalFilename,
      status: 'pending',
      message: 'Document uploaded and queued for processing',
    };
  }

  async listDocuments(
    userId: string,
    query: ListDocumentsQuery
  ): Promise<{ documents: DocumentRecord[]; total: number; page: number; limit: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM documents WHERE user_id = ? AND deleted_at IS NULL';
    let countSql = 'SELECT COUNT(*) as total FROM documents WHERE user_id = ? AND deleted_at IS NULL';
    const params: unknown[] = [userId];
    const countParams: unknown[] = [userId];

    if (query.roomId) {
      sql += ' AND room_id = ?';
      countSql += ' AND room_id = ?';
      params.push(query.roomId);
      countParams.push(query.roomId);
    }

    if (query.status) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(query.status);
      countParams.push(query.status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows, countRows] = await Promise.all([
      db.query<DocumentRecord[]>(sql, params),
      db.query<{ total: number }[]>(countSql, countParams),
    ]);

    const total = countRows[0]?.total || 0;

    return {
      documents: rows,
      total,
      page,
      limit,
    };
  }

  async getDocument(documentId: string, userId: string): Promise<DocumentRecord> {
    const rows = await db.query<DocumentRecord[]>(
      'SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL',
      [documentId]
    );

    const doc = rows[0];
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    if (doc.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    return doc;
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // 1. Fetch document and verify ownership
    const doc = await this.getDocument(documentId, userId);

    // 2. Soft delete document in MySQL
    await db.query(
      'UPDATE documents SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
      [documentId]
    );

    // 3. Clean up points in Qdrant directly
    try {
      await deletePointsByFilter(env.QDRANT_COLLECTION_NAME, { document_id: documentId });
    } catch (qdrantErr) {
      logger.error('Failed to delete Qdrant points during document deletion', qdrantErr, { documentId });
    }

    // 4. Delete file on local disk
    if (doc.s3_key) {
      const absolutePath = path.resolve(process.cwd(), doc.s3_key);
      await fs.unlink(absolutePath).catch((err) => {
        logger.warn('Failed to delete local file on soft-delete', { path: absolutePath, error: err.message });
      });
    }

    logger.info('Document deleted', { documentId, userId });
  }

  async getJobStatus(documentId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
    progress: number;
    failedReason?: string;
  }> {
    const job = await ingestionQueue.getJob(documentId);
    
    if (!job) {
      // If the job is cleared/absent in BullMQ, refer to the database status
      const docRows = await db.query<DocumentRecord[]>(
        'SELECT status, error_msg FROM documents WHERE id = ?',
        [documentId]
      );
      const doc = docRows[0];
      if (!doc) {
        return { status: 'unknown', progress: 0 };
      }
      if (doc.status === 'ready') {
        return { status: 'completed', progress: 100 };
      }
      if (doc.status === 'failed') {
        const res: { status: 'failed'; progress: number; failedReason?: string } = {
          status: 'failed',
          progress: 100,
        };
        if (doc.error_msg) {
          res.failedReason = doc.error_msg;
        }
        return res;
      }
      return { status: 'unknown', progress: 0 };
    }

    const state = (await job.getState()) as string;
    const progress = job.progress;
    const failedReason = job.failedReason;

    let status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown' = 'unknown';
    if (state === 'completed') status = 'completed';
    else if (state === 'failed') status = 'failed';
    else if (state === 'active') status = 'active';
    else if (state === 'waiting' || state === 'delayed' || state === 'paused') status = 'waiting';

    const resultObj: {
      status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
      progress: number;
      failedReason?: string;
    } = {
      status,
      progress: typeof progress === 'number' ? progress : 0,
    };

    if (failedReason) {
      resultObj.failedReason = failedReason;
    }

    return resultObj;
  }
}
