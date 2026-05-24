import { randomUUID } from 'node:crypto';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../../shared/db/mysql.js';
import { redis } from '../../shared/redis/redis.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { env } from '../../config/env.js';
import {
  RAG_CHAT_PROMPT,
  STANDALONE_QUESTION_PROMPT,
  SESSION_TITLE_PROMPT,
} from './chat.prompts.js';
import { chatMemory } from './chat.memory.js';
import { createChatModel } from '../../ai/llm/chatModel.js';
import type {
  ChatSession,
  ChatMessage,
  CitedSource,
  ChatAgentResponse,
  ListSessionsQuery,
  MessageRole,
} from './chat.types.js';

import * as HybridRetrieverModule from '../../ai/rag/hybridRetriever.js';
import * as RerankerModule from '../../ai/rag/reranker.js';

const hybridRetriever = HybridRetrieverModule as unknown as {
  retrieve: (opts: {
    query: string;
    filter: { documentIds: string[]; userId: string; roomId: string | null };
    topK: number;
  }) => Promise<Array<{
    content: string;
    metadata: {
      chunk_id: string;
      document_id: string;
      filename: string;
      page_number?: number | null;
      chunk_index: number;
      relevance_score?: number;
    };
  }>>;
};

const reranker = RerankerModule as unknown as {
  rerank: (
    query: string,
    chunks: Array<{
      content: string;
      metadata: Record<string, unknown>;
    }>,
    options: { topN: number }
  ) => Promise<Array<{
    content: string;
    metadata: {
      chunk_id: string;
      document_id: string;
      filename: string;
      page_number?: number | null;
      chunk_index: number;
      relevance_score?: number;
    };
  }>>;
};

export class ChatService {
  private async getSessionById(sessionId: string): Promise<ChatSession> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM chat_sessions WHERE id = ? AND deleted_at IS NULL', [sessionId]);
    const session = rows[0] as ChatSession | undefined;
    if (!session) {
      throw new AppError('Chat session not found', 404);
    }
    return session;
  }

  private async verifySessionOwnership(sessionId: string, userId: string): Promise<ChatSession> {
    const session = await this.getSessionById(sessionId);
    if (session.user_id !== userId) {
      throw new AppError('Forbidden: session does not belong to user', 403);
    }
    return session;
  }

  private async extractTextFromChunk(chunk: unknown): Promise<string> {
    if (!chunk || typeof chunk !== 'object') {
      return '';
    }

    const candidate = chunk as Record<string, unknown>;
    if (typeof candidate.text === 'string') {
      return candidate.text;
    }

    if (typeof candidate.content === 'string') {
      return candidate.content;
    }

    if (Array.isArray(candidate.content)) {
      return candidate.content
        .map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>).text : ''))
        .filter((value): value is string => typeof value === 'string')
        .join('');
    }

    return '';
  }

  private toBaseMessage(entry: { role: MessageRole | 'system'; content: string }) {
    if (entry.role === 'system') {
      return new SystemMessage(entry.content);
    }
    if (entry.role === 'user') {
      return new HumanMessage(entry.content);
    }
    return new AIMessage(entry.content);
  }

  private async validateDocumentIds(userId: string, documentIds: string[]) {
    if (documentIds.length === 0) {
      throw new AppError('No documents specified for chat retrieval', 422);
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM documents WHERE id IN (?) AND user_id = ? AND status = ? AND deleted_at IS NULL', [documentIds, userId, 'ready']);
    const validIds = rows.map((row) => String(row.id));
    if (validIds.length !== documentIds.length) {
      throw new AppError('Some documents are not available or not ready', 422);
    }
    return validIds;
  }

  private async loadSessionDocumentIds(session: ChatSession, sessionId: string): Promise<string[]> {
    const cacheKey = `chat:docs:${sessionId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const ids = JSON.parse(cached) as string[];
        if (Array.isArray(ids) && ids.length > 0) {
          return ids;
        }
      } catch {
        // ignore parse failures and reload from DB
      }
    }

    if (!session.room_id) {
      throw new AppError('No document ids are available for this chat session', 422);
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM documents WHERE room_id = ? AND user_id = ? AND status = ? AND deleted_at IS NULL', [session.room_id, session.user_id, 'ready']);
    const ids = rows.map((row) => String(row.id));
    if (ids.length === 0) {
      throw new AppError('No processed documents in this session. Upload and wait for processing.', 422);
    }

    await redis.set(cacheKey, JSON.stringify(ids), 'EX', env.REDIS_CHAT_MEMORY_TTL);
    return ids;
  }

  async createSession(userId: string, dto: { roomId?: string; title?: string; documentIds?: string[] }): Promise<ChatSession> {
    if (dto.roomId) {
      const [rooms] = await pool.query<RowDataPacket[]>('SELECT id FROM study_rooms WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [dto.roomId, userId]);
      if (rooms.length === 0) {
        throw new AppError('Study room not found or access denied', 404);
      }
    }

    const sessionId = randomUUID();
    const createdAt = new Date();
    await pool.query('INSERT INTO chat_sessions (id, user_id, room_id, title, message_count, deleted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [sessionId, userId, dto.roomId ?? null, dto.title ?? null, 0, null, createdAt, createdAt]);

    if (dto.documentIds && dto.documentIds.length > 0) {
      await redis.set(`chat:docs:${sessionId}`, JSON.stringify(dto.documentIds), 'EX', env.REDIS_CHAT_MEMORY_TTL);
    }

    return {
      id: sessionId,
      user_id: userId,
      room_id: dto.roomId ?? null,
      title: dto.title ?? null,
      message_count: 0,
      status: 'active',
      deleted_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    };
  }

  async listSessions(userId: string, query: ListSessionsQuery): Promise<{ sessions: Array<Record<string, unknown>>; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const baseConditions = ['s.user_id = ?', 's.deleted_at IS NULL'];
    const params: Array<string | number> = [userId];
    if (query.roomId) {
      baseConditions.push('s.room_id = ?');
      params.push(query.roomId);
    }

    const [sessions] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.title, s.room_id, s.message_count, m.content AS last_message, m.created_at AS last_message_at, s.created_at
       FROM chat_sessions s
       LEFT JOIN chat_messages m ON m.id = (
         SELECT id FROM chat_messages
         WHERE session_id = s.id
         ORDER BY created_at DESC
         LIMIT 1
       )
       WHERE ${baseConditions.join(' AND ')}
       ORDER BY COALESCE(m.created_at, s.created_at) DESC
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM chat_sessions s WHERE ${baseConditions.join(' AND ')}`, params);

    return {
      sessions: sessions.map((row) => ({
        id: String(row.id),
        title: row.title as string | null,
        room_id: row.room_id as string | null,
        message_count: Number(row.message_count),
        last_message: row.last_message as string | undefined,
        last_message_at: row.last_message_at ? new Date(row.last_message_at as string) : undefined,
        created_at: new Date(row.created_at as string),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async getSession(sessionId: string, userId: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
    const session = await this.verifySessionOwnership(sessionId, userId);
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC', [sessionId]);
    const messages = rows.map((row) => ({
      id: String(row.id),
      session_id: String(row.session_id),
      role: row.role as MessageRole,
      content: String(row.content),
      sources: row.sources ? (typeof row.sources === 'string' ? JSON.parse(row.sources) : row.sources) as CitedSource[] : null,
      tokens_used: row.tokens_used !== null ? Number(row.tokens_used) : null,
      model_used: row.model_used as string | null,
      created_at: new Date(row.created_at as string),
    }));

    return { session, messages };
  }

  async sendMessage(
    sessionId: string,
    userId: string,
    dto: { message: string; documentIds?: string[] },
    onToken: (token: string) => void,
    onDone: (result: ChatAgentResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const session = await this.verifySessionOwnership(sessionId, userId);
    if (session.status === 'archived') {
      throw new AppError('Chat session is archived and cannot accept new messages', 422);
    }

    const docKey = `chat:docs:${sessionId}`;
    let documentIds: string[];

    if (dto.documentIds && dto.documentIds.length > 0) {
      documentIds = await this.validateDocumentIds(userId, dto.documentIds);
      await redis.set(docKey, JSON.stringify(documentIds), 'EX', env.REDIS_CHAT_MEMORY_TTL);
    } else {
      documentIds = await this.loadSessionDocumentIds(session, sessionId);
    }

    const memory = await chatMemory.loadMemory(sessionId);
    const history = chatMemory.buildHistoryForPrompt(memory);
    const historyMessages = history.map((entry) => this.toBaseMessage(entry));

    let retrievalQuery = dto.message;
    if (historyMessages.length > 0) {
      const questionRewriteMessages = await STANDALONE_QUESTION_PROMPT.formatMessages({ history: historyMessages, question: dto.message } as any);
      const standaloneLlm = createChatModel({ model: env.SUMMARY_MODEL, temperature: 0 });
      const standaloneResult = await standaloneLlm.invoke(questionRewriteMessages as any);
      const rewrittenText = (await this.extractTextFromChunk(standaloneResult)).trim();
      if (rewrittenText.length > 0) {
        retrievalQuery = rewrittenText;
      }
    }

    const chunks = await hybridRetriever.retrieve({
      query: retrievalQuery,
      filter: { documentIds, userId, roomId: session.room_id },
      topK: 20,
    });

    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new AppError('No relevant document context could be retrieved for this message', 422);
    }

    const reranked = await reranker.rerank(retrievalQuery, chunks, { topN: env.MAX_CONTEXT_CHUNKS });
    const selectedChunks = Array.isArray(reranked) && reranked.length > 0 ? reranked.slice(0, env.MAX_CONTEXT_CHUNKS) : chunks.slice(0, env.MAX_CONTEXT_CHUNKS);
    const context = selectedChunks.map((chunk) => chunk.content).join('\n\n---\n\n');
    const sourceReferences = selectedChunks
      .map((chunk) => `- ${chunk.metadata.filename} (page ${chunk.metadata.page_number ?? 'N/A'})`)
      .join('\n');

    const promptMessages = await RAG_CHAT_PROMPT.formatMessages({
      context,
      source_references: sourceReferences,
      history: historyMessages,
      question: dto.message,
    } as any);

    const llm = createChatModel({
      model: env.CHAT_MODEL,
      temperature: 0.1,
      streaming: String(env.STREAMING_ENABLED).toLowerCase() === 'true',
    });

    let fullResponse = '';
    let tokensUsed = 0;
    const modelUsed = env.CHAT_MODEL;

    try {
      const stream = await llm.stream(promptMessages as any);
      for await (const chunk of stream) {
        const token = await this.extractTextFromChunk(chunk as unknown);
        if (!token) {
          continue;
        }
        fullResponse += token;
        tokensUsed += 1;
        onToken(token);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Chat generation failed'));
      throw error;
    }

    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();
    const citedSources: CitedSource[] = selectedChunks.map((chunk) => {
      const base: CitedSource = {
        chunk_id: chunk.metadata.chunk_id,
        document_id: chunk.metadata.document_id,
        filename: chunk.metadata.filename,
        page_number: chunk.metadata.page_number ?? null,
        chunk_index: chunk.metadata.chunk_index,
      };
      if (typeof (chunk.metadata as any).relevance_score === 'number') {
        (base as any).relevance_score = (chunk.metadata as any).relevance_score;
      }
      return base;
    });

    await pool.query('INSERT INTO chat_messages (id, session_id, role, content, sources, tokens_used, model_used) VALUES (?, ?, ?, ?, ?, ?, ?)', [userMessageId, sessionId, 'user', dto.message, null, null, null]);
    await pool.query('INSERT INTO chat_messages (id, session_id, role, content, sources, tokens_used, model_used) VALUES (?, ?, ?, ?, ?, ?, ?)', [assistantMessageId, sessionId, 'assistant', fullResponse, JSON.stringify(citedSources), tokensUsed, modelUsed]);

    if (session.message_count === 0) {
      const titlePrompt = await SESSION_TITLE_PROMPT.formatMessages({ question: dto.message } as any);
      const titleResult = await llm.invoke(titlePrompt as any);
      const titleText = (await this.extractTextFromChunk(titleResult)).trim().slice(0, 255);
      if (titleText.length > 0) {
        await pool.query('UPDATE chat_sessions SET title = ?, message_count = message_count + 2, updated_at = NOW() WHERE id = ?', [titleText, sessionId]);
      } else {
        await pool.query('UPDATE chat_sessions SET message_count = message_count + 2, updated_at = NOW() WHERE id = ?', [sessionId]);
      }
    } else {
      await pool.query('UPDATE chat_sessions SET message_count = message_count + 2, updated_at = NOW() WHERE id = ?', [sessionId]);
    }

    await chatMemory.appendMessage(sessionId, 'user', dto.message);
    await chatMemory.appendMessage(sessionId, 'assistant', fullResponse);
    await redis.set(docKey, JSON.stringify(documentIds), 'EX', env.REDIS_CHAT_MEMORY_TTL);

    onDone({ answer: fullResponse, sources: citedSources, tokensUsed, modelUsed });
  }

  async getMessages(sessionId: string, userId: string, page = 1, limit = 30): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean }> {
    await this.verifySessionOwnership(sessionId, userId);

    const offset = (page - 1) * limit;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [sessionId, limit, offset]);
    const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM chat_messages WHERE session_id = ?', [sessionId]);

    const total = Number(countRows[0]?.total ?? 0);
    const messages = rows
      .map((row) => ({
        id: String(row.id),
        session_id: String(row.session_id),
        role: row.role as MessageRole,
        content: String(row.content),
        sources: row.sources ? (typeof row.sources === 'string' ? JSON.parse(row.sources) : row.sources) as CitedSource[] : null,
        tokens_used: row.tokens_used !== null ? Number(row.tokens_used) : null,
        model_used: row.model_used as string | null,
        created_at: new Date(row.created_at as string),
      }))
      .reverse();

    return {
      messages,
      total,
      hasMore: offset + messages.length < total,
    };
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    await this.verifySessionOwnership(sessionId, userId);
    await pool.query('UPDATE chat_sessions SET deleted_at = NOW() WHERE id = ?', [sessionId]);
    await chatMemory.clearMemory(sessionId);
    await redis.del(`chat:docs:${sessionId}`);
    logger.info('Chat session deleted', { sessionId, userId });
  }

  async archiveSession(sessionId: string, userId: string): Promise<void> {
    await this.verifySessionOwnership(sessionId, userId);
    await pool.query('UPDATE chat_sessions SET status = ?, updated_at = NOW() WHERE id = ?', ['archived', sessionId]);
  }

  async unarchiveSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.verifySessionOwnership(sessionId, userId);
    if (session.status !== 'archived') {
      // No-op if already active
      return;
    }
    await pool.query('UPDATE chat_sessions SET status = ?, updated_at = NOW() WHERE id = ?', ['active', sessionId]);
  }

  async clearSessionMemory(sessionId: string, userId: string): Promise<void> {
    await this.verifySessionOwnership(sessionId, userId);
    await chatMemory.clearMemory(sessionId);

    const [rows] = await pool.query<RowDataPacket[]>('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?', [sessionId, env.CHAT_MAX_HISTORY_MESSAGES]);
    for (const row of rows) {
      const role = row.role as MessageRole;
      const content = String(row.content);
      await chatMemory.appendMessage(sessionId, role, content);
    }

    logger.info('Chat memory rebuilt from history', { sessionId, userId });
  }
}
