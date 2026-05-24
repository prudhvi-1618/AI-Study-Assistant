import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { pool } from '../../shared/db/mysql.js';
import { AppError } from '../../shared/errors/AppError.js';
import { createChatModel } from '../../ai/llm/chatModel.js';
import {
  FULL_SUMMARY_PROMPT,
  SECTION_SUMMARY_PROMPT,
  COMPARE_DOCUMENTS_PROMPT,
  REVISION_NOTES_PROMPT,
} from './summary.prompts.js';
import type { RowDataPacket } from 'mysql2';

import * as HybridRetrieverModule from '../../ai/rag/hybridRetriever.js';
import * as RerankerModule from '../../ai/rag/reranker.js';

const hybridRetriever = HybridRetrieverModule as unknown as {
  retrieve: (opts: {
    query: string;
    filter: { documentIds: string[]; userId: string; roomId: string | null };
    topK: number;
  }) => Promise<Array<{ content: string; metadata: Record<string, unknown> }>>;
};

const reranker = RerankerModule as unknown as {
  rerank: (
    query: string,
    chunks: Array<{ content: string; metadata: Record<string, unknown> }>,
    options: { topN: number }
  ) => Promise<Array<{ content: string; metadata: Record<string, unknown> }>>;
};

type SummaryType = 'full' | 'section' | 'compare' | 'revision_notes';

export interface SummaryAgentResult {
  content: Record<string, unknown>;
  modelUsed: string;
  tokensUsed: number;
}

const parseJsonResponse = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const buildSummaryQuery = (type: SummaryType, sectionTopic: string | null, focusTopics: string[] | null): string => {
  switch (type) {
    case 'full':
      return 'main concepts definitions key topics overview';
    case 'section':
      return sectionTopic ?? 'section summary';
    case 'compare':
      return 'main concepts key points summary';
    case 'revision_notes':
      return focusTopics && focusTopics.length > 0 ? focusTopics.join(' ') : 'key exam points formulas';
    default:
      return 'study material summary';
  }
};

const validateSummaryContent = (type: SummaryType, content: Record<string, unknown>): void => {
  const requiredMap: Record<SummaryType, string[]> = {
    full: ['tldr', 'key_points', 'detailed_summary', 'topics_covered'],
    section: ['summary', 'key_points'],
    compare: ['overview', 'common_themes', 'key_points'],
    revision_notes: ['sections', 'must_remember'],
  };
  const requiredKeys = requiredMap[type];
  const missing = requiredKeys.filter((key) => !(key in content));
  if (missing.length > 0) {
    throw new AppError(`Summary response is missing required fields: ${missing.join(', ')}`, 422);
  }
};

const extractTextFromChunk = (chunk: unknown): string => {
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
};

export async function generateSummaryWithAgent(input: {
  userId: string;
  documentIds: string[];
  roomId?: string | null;
  summaryType?: SummaryType;
  sectionTopic?: string;
  focusTopics?: string[];
  subject?: string;
}): Promise<SummaryAgentResult> {
  const type = input.summaryType ?? 'full';

  if (type === 'section' && (!input.sectionTopic || input.sectionTopic.trim().length === 0)) {
    throw new AppError('Section topic is required for section summaries', 400);
  }

  const [docRows] = await pool.query<RowDataPacket[]>('SELECT filename FROM documents WHERE id IN (?) AND user_id = ? AND status = ? AND deleted_at IS NULL', [input.documentIds, input.userId, 'ready']);
  const filenames = docRows.map((row) => String(row.filename));
  if (filenames.length !== input.documentIds.length) {
    throw new AppError('Some documents are not available for summary generation', 403);
  }

  const query = buildSummaryQuery(type, input.sectionTopic ?? null, input.focusTopics ?? null);
  const chunks = await hybridRetriever.retrieve({
    query,
    filter: { documentIds: input.documentIds, userId: input.userId, roomId: input.roomId ?? null },
    topK: 30,
  });

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new AppError('Could not retrieve enough document context for summary generation', 422);
  }

  const topN = type === 'section' ? 8 : type === 'revision_notes' ? 10 : 15;
  const reranked = await reranker.rerank(query, chunks, { topN });
  const selectedChunks = Array.isArray(reranked) && reranked.length > 0 ? reranked.slice(0, topN) : chunks.slice(0, topN);
  const context = selectedChunks.map((chunk) => chunk.content).join('\n\n---\n\n');

  let prompt;
  let promptVars: Record<string, unknown>;

  switch (type) {
    case 'full':
      prompt = FULL_SUMMARY_PROMPT;
      promptVars = {
        context,
        filename: filenames[0],
        subject: input.subject ?? 'General',
      };
      break;
    case 'section':
      prompt = SECTION_SUMMARY_PROMPT;
      promptVars = {
        context,
        filename: filenames[0],
        section_topic: input.sectionTopic ?? 'Section',
      };
      break;
    case 'compare':
      prompt = COMPARE_DOCUMENTS_PROMPT;
      promptVars = {
        context,
        document_names: filenames.join(', '),
      };
      break;
    case 'revision_notes':
      prompt = REVISION_NOTES_PROMPT;
      promptVars = {
        context,
        filename: filenames[0],
        focus_topics: input.focusTopics && input.focusTopics.length > 0 ? input.focusTopics.join(', ') : 'all topics',
      };
      break;
    default:
      throw new AppError('Unsupported summary type', 400);
  }

  const llm = createChatModel({
    model: env.SUMMARY_MODEL,
    temperature: 0.2,
  });

  const promptMessages = await prompt.formatMessages(promptVars as any);
  const resultChunk = await llm.invoke(promptMessages as any);
  const rawText = extractTextFromChunk(resultChunk).trim();
  const parsed = parseJsonResponse(rawText);

  if (!parsed) {
    throw new AppError('Unable to parse summary output from the model', 422);
  }

  validateSummaryContent(type, parsed);

  return {
    content: parsed,
    modelUsed: env.SUMMARY_MODEL,
    tokensUsed: 0,
  };
}
