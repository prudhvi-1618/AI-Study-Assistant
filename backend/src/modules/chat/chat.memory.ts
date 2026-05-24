import { ChatOpenAI } from '@langchain/openai';
import { CONDENSE_HISTORY_PROMPT } from './chat.prompts.js';
import { redis } from '../../shared/redis/redis.js';
import { logger } from '../../shared/logger/logger.js';
import { env } from '../../config/env.js';
import type { MessageRole } from './chat.types.js';
import { createChatModel } from '../../ai/llm/chatModel.js';

interface MemoryMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}

interface SessionMemory {
  recentMessages: MemoryMessage[];
  summary: string | null;
}

type PromptHistoryEntry = MemoryMessage | { role: 'system'; content: string };

export class ChatMemoryManager {
  private getMemoryKey(sessionId: string): string {
    return `chat:memory:${sessionId}`;
  }

  private getSummaryKey(sessionId: string): string {
    return `chat:summary:${sessionId}`;
  }

  private getMetaKey(sessionId: string): string {
    return `chat:meta:${sessionId}`;
  }

  private async parseJsonArray<T>(key: string): Promise<T[]> {
    const raw = await redis.get(key);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private extractTextFromChunk(chunk: unknown): string {
    if (!chunk || typeof chunk !== 'object') {
      return '';
    }

    const candidate = chunk as { text?: string; content?: unknown };
    if (typeof candidate.text === 'string' && candidate.text.length > 0) {
      return candidate.text;
    }

    if (typeof candidate.content === 'string') {
      return candidate.content;
    }

    if (Array.isArray(candidate.content)) {
      return candidate.content
        .map((item) => (typeof item === 'object' && item !== null ? (item as Record<string, unknown>).text : ''))
        .filter((text): text is string => typeof text === 'string')
        .join('');
    }

    return '';
  }

  async loadMemory(sessionId: string): Promise<SessionMemory> {
    const recentMessages = await this.parseJsonArray<MemoryMessage>(this.getMemoryKey(sessionId));
    const summary = await redis.get(this.getSummaryKey(sessionId));
    return {
      recentMessages,
      summary: summary ?? null,
    };
  }

  async appendMessage(sessionId: string, role: MessageRole, content: string): Promise<void> {
    const memoryKey = this.getMemoryKey(sessionId);
    const metaKey = this.getMetaKey(sessionId);
    const recentMessages = await this.parseJsonArray<MemoryMessage>(memoryKey);
    const updatedMessages = [...recentMessages, { role, content, timestamp: Date.now() }];

    if (updatedMessages.length > env.CHAT_MAX_HISTORY_MESSAGES) {
      await this.condenseMemory(sessionId, updatedMessages);
    } else {
      await redis.set(memoryKey, JSON.stringify(updatedMessages), 'EX', env.REDIS_CHAT_MEMORY_TTL);
    }

    await redis.hincrby(metaKey, 'messageCount', 1);
    await redis.hset(metaKey, 'lastActivity', Date.now().toString());
    await redis.expire(memoryKey, env.REDIS_CHAT_MEMORY_TTL);
    await redis.expire(metaKey, env.REDIS_CHAT_MEMORY_TTL);
    await redis.expire(this.getSummaryKey(sessionId), env.REDIS_CHAT_MEMORY_TTL);
  }

  async condenseMemory(sessionId: string, recentMessages: MemoryMessage[]): Promise<void> {
    const memoryKey = this.getMemoryKey(sessionId);
    const summaryKey = this.getSummaryKey(sessionId);
    const metaKey = this.getMetaKey(sessionId);

    const cutoff = Math.floor(recentMessages.length / 2);
    if (cutoff <= 0) {
      await redis.set(memoryKey, JSON.stringify(recentMessages), 'EX', env.REDIS_CHAT_MEMORY_TTL);
      await redis.expire(metaKey, env.REDIS_CHAT_MEMORY_TTL);
      return;
    }

    const messagesToCondense = recentMessages.slice(0, cutoff);
    const keptMessages = recentMessages.slice(cutoff);
    const previousSummary = await redis.get(summaryKey);
    const condensedInput = messagesToCondense
      .map((message) => `${message.role === 'user' ? 'Student' : 'Tutor'}: ${message.content}`)
      .join('\n');
    const promptInput = previousSummary
      ? `Previous summary: ${previousSummary}\n\nNew messages:\n${condensedInput}`
      : condensedInput;

    try {
      const llm = createChatModel({
        model: env.CHAT_MODEL,
        temperature: 0,
      });

      const promptMessages = await CONDENSE_HISTORY_PROMPT.formatMessages({ history: promptInput } as any);
      const response = await llm.invoke(promptMessages as any);
      const condensed = this.extractTextFromChunk(response).trim();
      const finalSummary = condensed.length > 0 ? condensed : previousSummary ?? '';

      await redis.set(summaryKey, finalSummary, 'EX', env.REDIS_CHAT_MEMORY_TTL);
      await redis.set(memoryKey, JSON.stringify(keptMessages), 'EX', env.REDIS_CHAT_MEMORY_TTL);
      await redis.expire(metaKey, env.REDIS_CHAT_MEMORY_TTL);
      logger.debug('Memory condensed', {
        sessionId,
        condensedCount: messagesToCondense.length,
        keptCount: keptMessages.length,
      });
    } catch (error) {
      logger.error('Failed to condense chat memory', error, { sessionId });
      await redis.set(memoryKey, JSON.stringify(keptMessages), 'EX', env.REDIS_CHAT_MEMORY_TTL);
      await redis.expire(metaKey, env.REDIS_CHAT_MEMORY_TTL);
    }
  }

  buildHistoryForPrompt(memory: SessionMemory): PromptHistoryEntry[] {
    const history: PromptHistoryEntry[] = [];
    if (memory.summary && memory.recentMessages.length > 0) {
      history.push({ role: 'system', content: `Earlier conversation summary: ${memory.summary}` });
    }
    history.push(...memory.recentMessages);
    return history;
  }

  async clearMemory(sessionId: string): Promise<void> {
    const memoryKey = this.getMemoryKey(sessionId);
    const summaryKey = this.getSummaryKey(sessionId);
    const metaKey = this.getMetaKey(sessionId);
    await Promise.all([
      redis.del(memoryKey),
      redis.del(summaryKey),
      redis.del(metaKey),
    ]);
  }

  async getMemoryStats(sessionId: string): Promise<{
    messageCount: number;
    hasSummary: boolean;
    lastActivity: Date | null;
    memorySizeBytes: number;
  }> {
    const metaKey = this.getMetaKey(sessionId);
    const messageCountValue = await redis.hget(metaKey, 'messageCount');
    const lastActivityValue = await redis.hget(metaKey, 'lastActivity');
    const memorySizeBytes = Buffer.byteLength(JSON.stringify(await this.parseJsonArray<MemoryMessage>(this.getMemoryKey(sessionId))), 'utf8');
    return {
      messageCount: Number(messageCountValue ?? '0'),
      hasSummary: (await redis.exists(this.getSummaryKey(sessionId))) === 1,
      lastActivity: lastActivityValue ? new Date(Number(lastActivityValue)) : null,
      memorySizeBytes,
    };
  }
}

export const chatMemory = new ChatMemoryManager();
