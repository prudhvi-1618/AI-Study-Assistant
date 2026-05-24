import { randomUUID } from 'node:crypto';
import { pool } from '../../shared/db/mysql.js';
import { redis } from '../../shared/redis/redis.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { env } from '../../config/env.js';
import { generateSummaryWithAgent } from './summary.agent.js';
import type { RowDataPacket } from 'mysql2';

type SummaryType = 'full' | 'section' | 'compare' | 'revision_notes';

export interface SummaryRecord {
  id: string;
  document_id: string;
  user_id: string;
  room_id: string | null;
  type: SummaryType;
  content: Record<string, unknown>;
  model_used: string;
  tokens_used: number | null;
  created_at: Date;
}

export class SummaryService {
  private parseContent(value: unknown): Record<string, unknown> {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  async generateSummary(params: {
    userId: string;
    documentIds: string[];
    roomId?: string;
    type?: SummaryType;
    sectionTopic?: string;
    focusTopics?: string[];
    subject?: string;
    forceRegenerate?: boolean;
  }): Promise<{ summaryId: string; content: Record<string, unknown>; fromCache: boolean }> {
    const summaryType = params.type ?? 'full';
    const documentIds = params.documentIds;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new AppError('documentIds is required', 400);
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM documents WHERE id IN (?) AND user_id = ? AND status = ? AND deleted_at IS NULL', [documentIds, params.userId, 'ready']);
    if (rows.length !== documentIds.length) {
      throw new AppError('Some documents are not ready or do not belong to this user', 422);
    }

    const sortedIds = [...documentIds].sort();
    const cacheKey = `summary:${params.userId}:${sortedIds.join('-')}:${summaryType}:${params.sectionTopic ?? ''}:${(params.focusTopics ?? []).slice().sort().join(',')}:${params.subject ?? ''}`;

    if (!params.forceRegenerate) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { summaryId: string; content: Record<string, unknown> };
          return { summaryId: parsed.summaryId, content: parsed.content, fromCache: true };
        } catch {
          // ignore stale cache
        }
      }
    }

    const agentInput: any = { userId: params.userId, documentIds };
    if (params.roomId !== undefined) agentInput.roomId = params.roomId ?? null;
    if (summaryType !== undefined) agentInput.summaryType = summaryType;
    if (params.sectionTopic !== undefined) agentInput.sectionTopic = params.sectionTopic;
    if (params.focusTopics !== undefined) agentInput.focusTopics = params.focusTopics;
    if (params.subject !== undefined) agentInput.subject = params.subject;

    const result = await generateSummaryWithAgent(agentInput);

    const summaryId = randomUUID();
    const documentId = documentIds.length === 1 ? documentIds[0] : documentIds[0];

    await pool.query('INSERT INTO summaries (id, document_id, user_id, room_id, type, content, model_used, tokens_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      summaryId,
      documentId,
      params.userId,
      params.roomId ?? null,
      summaryType,
      JSON.stringify(result.content),
      result.modelUsed,
      result.tokensUsed,
    ]);

    const summaryKeysKey = `summary-keys:${params.userId}`;
    await redis.set(cacheKey, JSON.stringify({ summaryId, content: result.content }), 'EX', env.REDIS_SUMMARY_CACHE_TTL);
    await redis.sadd(summaryKeysKey, cacheKey);
    await redis.expire(summaryKeysKey, 7 * 24 * 60 * 60);

    logger.info('Summary generated', { userId: params.userId, summaryId, type: summaryType, documentCount: documentIds.length });

    return { summaryId, content: result.content, fromCache: false };
  }

  async listSummaries(userId: string, params: { roomId?: string; documentId?: string; type?: SummaryType; page?: number; limit?: number }): Promise<{ summaries: SummaryRecord[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;
    const filters: string[] = ['user_id = ?'];
    const values: Array<string | number> = [userId];

    if (params.roomId) {
      filters.push('room_id = ?');
      values.push(params.roomId);
    }
    if (params.documentId) {
      filters.push('document_id = ?');
      values.push(params.documentId);
    }
    if (params.type) {
      filters.push('type = ?');
      values.push(params.type);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM summaries WHERE ${filters.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...values, limit, offset]);
    const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM summaries WHERE ${filters.join(' AND ')}`, values);

    return {
      summaries: rows.map((row) => ({
        id: String(row.id),
        document_id: String(row.document_id),
        user_id: String(row.user_id),
        room_id: row.room_id as string | null,
        type: row.type as SummaryType,
        content: this.parseContent(row.content),
        model_used: String(row.model_used),
        tokens_used: row.tokens_used !== null ? Number(row.tokens_used) : null,
        created_at: new Date(row.created_at as string),
      })),
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  async getSummary(summaryId: string, userId: string): Promise<SummaryRecord> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM summaries WHERE id = ? AND user_id = ?', [summaryId, userId]);
    const row = rows[0];
    if (!row) {
      throw new AppError('Summary not found', 404);
    }

    return {
      id: String(row.id),
      document_id: String(row.document_id),
      user_id: String(row.user_id),
      room_id: row.room_id as string | null,
      type: row.type as SummaryType,
      content: this.parseContent(row.content),
      model_used: String(row.model_used),
      tokens_used: row.tokens_used !== null ? Number(row.tokens_used) : null,
      created_at: new Date(row.created_at as string),
    };
  }

  async deleteSummary(summaryId: string, userId: string): Promise<void> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM summaries WHERE id = ? AND user_id = ?', [summaryId, userId]);
    if (rows.length === 0) {
      throw new AppError('Summary not found', 404);
    }

    await pool.query('DELETE FROM summaries WHERE id = ?', [summaryId]);

    const cacheKeysKey = `summary-keys:${userId}`;
    const cacheKeys = await redis.smembers(cacheKeysKey);
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
    }
    await redis.del(cacheKeysKey);
  }

  async getOrGenerate(params: { userId: string; documentId: string; type?: SummaryType; maxAgeHours?: number }): Promise<{ summaryId: string; content: Record<string, unknown>; isNew: boolean }> {
    const type = params.type ?? 'full';
    const maxAge = params.maxAgeHours ?? 24;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM summaries WHERE document_id = ? AND user_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1', [params.documentId, params.userId, type]);

    if (rows.length > 0) {
      const row = rows[0]!;
      const createdAt = new Date(row.created_at as string);
      const ageMs = Date.now() - createdAt.getTime();
      if (ageMs <= maxAge * 60 * 60 * 1000) {
        return {
          summaryId: String(row.id),
          content: this.parseContent(row.content),
          isNew: false,
        };
      }
    }

    const result = await this.generateSummary({
      userId: params.userId,
      documentIds: [params.documentId],
      type,
      forceRegenerate: true,
    });

    return {
      summaryId: result.summaryId,
      content: result.content,
      isNew: true,
    };
  }
}
