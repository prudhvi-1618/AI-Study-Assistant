import type { RowDataPacket } from 'mysql2';
import { env } from '../../config/env.js';
import { pool } from '../../shared/db/mysql.js';
import { logger } from '../../shared/logger/logger.js';
import { QdrantClient } from '../../shared/qdrant/qdrant.js';
import { embedTexts } from './embeddings.js';

export interface RetrievalFilter {
  documentIds: string[];
  userId: string;
  roomId: string | null;
}

export interface RetrievedChunk {
  content: string;
  metadata: {
    chunk_id: string;
    document_id: string;
    filename: string;
    page_number?: number | null;
    chunk_index: number;
    relevance_score?: number;
  };
}

interface ChunkRow extends RowDataPacket {
  id: string;
  document_id: string;
  filename: string;
  content: string;
  page_number: number | null;
  chunk_index: number;
}

function toRetrievedChunk(row: ChunkRow, relevanceScore?: number): RetrievedChunk {
  const metadata: RetrievedChunk['metadata'] = {
    chunk_id: String(row.id),
    document_id: String(row.document_id),
    filename: String(row.filename),
    page_number: row.page_number === null ? null : Number(row.page_number),
    chunk_index: Number(row.chunk_index),
  };

  if (typeof relevanceScore === 'number') {
    metadata.relevance_score = relevanceScore;
  }

  return {
    content: String(row.content),
    metadata,
  };
}

async function fetchChunksByIds(chunkIds: string[], relevanceScores: Map<string, number>): Promise<RetrievedChunk[]> {
  if (chunkIds.length === 0) {
    return [];
  }

  const [rows] = await pool.query<ChunkRow[]>(
    `SELECT c.id, c.document_id, d.filename, c.content, c.page_number, c.chunk_index
     FROM document_chunks c
     INNER JOIN documents d ON d.id = c.document_id
     WHERE c.id IN (?)`,
    [chunkIds]
  );

  const byId = new Map(rows.map((row) => [String(row.id), row]));
  return chunkIds
    .map((id) => {
      const row = byId.get(id);
      return row ? toRetrievedChunk(row, relevanceScores.get(id)) : null;
    })
    .filter((chunk): chunk is RetrievedChunk => chunk !== null);
}

async function fallbackRetrieve(filter: RetrievalFilter, topK: number): Promise<RetrievedChunk[]> {
  const params: unknown[] = [filter.userId, filter.documentIds, topK];
  const roomClause = filter.roomId ? 'AND c.room_id = ?' : '';
  if (filter.roomId) {
    params.splice(2, 0, filter.roomId);
  }

  const [rows] = await pool.query<ChunkRow[]>(
    `SELECT c.id, c.document_id, d.filename, c.content, c.page_number, c.chunk_index
     FROM document_chunks c
     INNER JOIN documents d ON d.id = c.document_id
     WHERE c.user_id = ?
       AND c.document_id IN (?)
       ${roomClause}
       AND d.deleted_at IS NULL
     ORDER BY c.document_id, c.chunk_index
     LIMIT ?`,
    params
  );

  return rows.map((row) => toRetrievedChunk(row));
}

export async function retrieve(opts: {
  query: string;
  filter: RetrievalFilter;
  topK: number;
}): Promise<RetrievedChunk[]> {
  const topK = Math.max(1, opts.topK);
  if (opts.filter.documentIds.length === 0) {
    return [];
  }

  try {
    const queryVector = (await embedTexts([opts.query]))[0];
    if (!queryVector) {
      return fallbackRetrieve(opts.filter, topK);
    }

    const must: Array<Record<string, unknown>> = [
      { key: 'user_id', match: { value: opts.filter.userId } },
      { key: 'document_id', match: { any: opts.filter.documentIds } },
    ];

    if (opts.filter.roomId) {
      must.push({ key: 'room_id', match: { value: opts.filter.roomId } });
    }

    const response = await QdrantClient.collections.searchPoints(env.QDRANT_COLLECTION_NAME, {
      vector: queryVector,
      filter: { must },
      limit: topK,
      with_payload: true as any,
    });

    const points = ((response as any).result ?? []) as Array<{ id: string | number; score?: number }>;
    const chunkIds = points.map((point) => String(point.id));
    const scores = new Map(chunkIds.map((id, index) => [id, points[index]?.score ?? 0]));
    const chunks = await fetchChunksByIds(chunkIds, scores);

    if (chunks.length > 0) {
      return chunks;
    }
  } catch (error) {
    logger.error('Hybrid retriever vector search failed, falling back to database', error);
  }

  return fallbackRetrieve(opts.filter, topK);
}
