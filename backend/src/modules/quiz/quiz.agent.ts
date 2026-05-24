import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../../config/env.js';
import { db } from '../../shared/db/mysql.js';
import { QdrantClient } from '../../shared/qdrant/qdrant.js';
import { embedTexts } from '../../ai/rag/embeddings.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { MCQ_GENERATION_PROMPT, ADAPTIVE_MCQ_PROMPT } from './quiz.prompts.js';
import { getLLM } from '../flashcards/flashcard.agent.js';

export const QuizGenerationStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  documentIds: Annotation<string[]>(),
  roomId: Annotation<string | null>(),
  count: Annotation<number>(),
  difficultyMix: Annotation<{ easy: number; medium: number; hard: number }>(),
  topicFocus: Annotation<string | null>(),
  weakTopics: Annotation<string[] | null>(),
  isAdaptive: Annotation<boolean>(),

  retrievedChunks: Annotation<Array<{ content: string; metadata: Record<string, any> }>>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  rerankedChunks: Annotation<Array<{ content: string; metadata: Record<string, any> }>>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  context: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  weaknessDetails: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),

  generatedQuestions: Annotation<Array<{
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
  }>>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  quizTitle: Annotation<string>({
    reducer: (x, y) => y,
    default: () => 'Syllabus Quiz',
  }),
  topicsCovered: Annotation<string[]>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  modelUsed: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  tokensUsed: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  error: Annotation<string | null>({
    reducer: (x, y) => y,
    default: () => null,
  }),
});

export type QuizGenerationState = typeof QuizGenerationStateAnnotation.State;

// Node 1: retrieve_context
async function retrieveContext(state: QuizGenerationState) {
  const { userId, documentIds, roomId, topicFocus, isAdaptive, weakTopics } = state;
  
  let query = '';
  if (isAdaptive && weakTopics && weakTopics.length > 0) {
    query = weakTopics.join(' ') + ' ' + (topicFocus || '');
  } else {
    query = topicFocus || 'key concepts for exam';
  }
  
  const limit = 25; // Higher limit for quizzes to gather diverse topics
  logger.info('retrieve_context node running for quiz', { userId, query });

  try {
    const queryVector = (await embedTexts([query]))[0];
    if (queryVector) {
      const filter: any = {
        must: [
          { key: 'user_id', match: { value: userId } }
        ]
      };
      if (roomId) {
        filter.must.push({ key: 'room_id', match: { value: roomId } });
      }
      if (documentIds && documentIds.length > 0) {
        filter.must.push({ key: 'document_id', match: { any: documentIds } });
      }

      const response = await QdrantClient.collections.searchPoints(env.QDRANT_COLLECTION_NAME, {
        vector: queryVector,
        filter,
        limit,
        with_payload: true as any
      });

      const points = (response as any).result || [];
      if (points.length > 0) {
        const chunkIds = points.map((p: any) => p.id);
        const rows = await db.query<any[]>(
          `SELECT id, content, page_number as pageNumber, chunk_index as chunkIndex FROM document_chunks WHERE id IN (?)`,
          [chunkIds]
        );
        const rowsMap = new Map(rows.map((r: any) => [r.id, r]));
        const retrievedChunks = points
          .map((p: any) => rowsMap.get(p.id))
          .filter((c: any): c is any => !!c)
          .map((c: any) => ({
            content: c.content,
            metadata: { id: c.id, pageNumber: c.pageNumber, chunkIndex: c.chunkIndex }
          }));

        if (retrievedChunks.length > 0) {
          return { retrievedChunks };
        }
      }
    }
  } catch (err) {
    logger.error('Qdrant search failed in quiz agent, falling back to database', err);
  }

  // Fallback to database retrieval
  try {
    const placeholders = documentIds.map(() => '?').join(', ');
    const rows = await db.query<any[]>(
      `SELECT id, content, page_number as pageNumber, chunk_index as chunkIndex FROM document_chunks WHERE user_id = ? AND document_id IN (${placeholders}) LIMIT ?`,
      [userId, ...documentIds, limit]
    );
    const retrievedChunks = rows.map(r => ({
      content: r.content,
      metadata: { id: r.id, pageNumber: r.pageNumber, chunkIndex: r.chunkIndex }
    }));
    return { retrievedChunks };
  } catch (dbErr) {
    logger.error('Database retrieval failed in quiz agent', dbErr);
    return { retrievedChunks: [], error: 'Failed to retrieve study material context.' };
  }
}

// Node 2: fetch_weak_topics (Only if isAdaptive=true)
async function fetchWeakTopics(state: QuizGenerationState) {
  const { userId } = state;
  logger.info('fetch_weak_topics node running', { userId });

  try {
    const rows = await db.query<any[]>(
      `SELECT topic_name, mastery_score, quiz_accuracy FROM topic_mastery 
       WHERE user_id = ? AND (weak_flag = 1 OR mastery_score < 60)
       ORDER BY mastery_score ASC LIMIT 5`,
      [userId]
    );

    const weaknessDetails = rows.map(
      r => `${r.topic_name} (mastery score: ${r.mastery_score}%, quiz accuracy: ${r.quiz_accuracy}%)`
    ).join('\n');

    const topics = rows.map(r => r.topic_name);

    return {
      weakTopics: topics,
      weaknessDetails
    };
  } catch (err) {
    logger.error('Error fetching weak topics in agent', err);
    return {
      weakTopics: [],
      weaknessDetails: 'No assessed weak topics found.'
    };
  }
}

// Node 3: rerank_chunks
async function rerankChunks(state: QuizGenerationState) {
  logger.info('rerank_chunks node running for quiz', { retrieved: state.retrievedChunks.length });
  // Pass-through slice to top 10 chunks to allow diversity in quiz questions
  const rerankedChunks = state.retrievedChunks.slice(0, 10);
  const context = rerankedChunks.map(c => c.content).join('\n\n---\n\n');
  return { rerankedChunks, context };
}

// Node 4: generate_questions
async function generateQuestions(state: QuizGenerationState) {
  if (state.error) return {};

  const modelName = env.QUIZ_GENERATION_MODEL || 'gemini-3.5-flash';
  logger.info('generate_questions node running', { modelName, count: state.count, adaptive: state.isAdaptive });

  try {
    const llm = getLLM(modelName);
    
    let prompt = '';
    if (state.isAdaptive) {
      prompt = await ADAPTIVE_MCQ_PROMPT.format({
        weak_topics: state.weakTopics ? state.weakTopics.join(', ') : 'None',
        weakness_details: state.weaknessDetails || 'None',
        count: state.count,
        context: state.context,
      });
    } else {
      const mix = state.difficultyMix || { easy: 30, medium: 50, hard: 20 };
      const difficultyMixStr = `${mix.easy}% easy, ${mix.medium}% medium, ${mix.hard}% hard`;
      
      prompt = await MCQ_GENERATION_PROMPT.format({
        count: state.count,
        context: state.context,
        topic_focus: state.topicFocus || 'General study material content',
        difficulty_mix: difficultyMixStr,
      });
    }

    const response = await llm.invoke(prompt);
    const contentText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Clean and parse JSON response
    let cleaned = contentText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
    }

    const data = JSON.parse(cleaned);
    const generatedQuestions = Array.isArray(data.questions) ? data.questions : [];
    const quizTitle = data.quiz_title || 'Document Quiz';
    const topicsCovered = Array.isArray(data.topics_covered) ? data.topics_covered : [];

    const tokensUsed = (response as any).usage_metadata?.total_tokens || Math.ceil(contentText.length / 4);

    return {
      generatedQuestions,
      quizTitle,
      topicsCovered,
      modelUsed: modelName,
      tokensUsed,
    };
  } catch (err: any) {
    logger.error('LLM invocation or parsing failed during quiz generation', err);
    return { error: `LLM generation error: ${err.message}` };
  }
}

// Node 5: validate_questions
async function validateQuestions(state: QuizGenerationState) {
  if (state.error) return {};

  logger.info('validate_questions node running', { questionsCount: state.generatedQuestions.length });

  const validQuestions = state.generatedQuestions.filter(q => {
    // Enforce exactly 4 options
    const hasFourOptions = q.options && 
      typeof q.options.A === 'string' &&
      typeof q.options.B === 'string' &&
      typeof q.options.C === 'string' &&
      typeof q.options.D === 'string';
      
    // Enforce correct answer is one of A, B, C, D
    const hasCorrectAnswer = ['A', 'B', 'C', 'D'].includes(q.correct_answer);
    
    return q.question && q.question.trim() && hasFourOptions && hasCorrectAnswer;
  });

  // Naive duplicate check
  const uniqueQuestions: typeof validQuestions = [];
  const seenTexts = new Set<string>();

  for (const q of validQuestions) {
    const norm = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenTexts.has(norm)) {
      seenTexts.add(norm);
      uniqueQuestions.push(q);
    }
  }

  if (uniqueQuestions.length < 3) {
    return { error: 'Insufficient content generated' };
  }

  // Cap at the requested count
  return {
    generatedQuestions: uniqueQuestions.slice(0, state.count)
  };
}

// Node 6: handle_error
async function handleError(state: QuizGenerationState) {
  logger.error('Error occurred in quiz LangGraph execution', { error: state.error });
  return {};
}

// Conditional routing after retrieve_context
function routeAfterRetrieve(state: QuizGenerationState) {
  if (state.isAdaptive) {
    return 'fetch_weak_topics';
  }
  return 'rerank_chunks';
}

// Conditional routing after generate_questions
function routeAfterGeneration(state: QuizGenerationState) {
  if (state.error) {
    return 'error';
  }
  return 'validate';
}

// Assemble the StateGraph
export const quizGenerationGraph = new StateGraph(QuizGenerationStateAnnotation)
  .addNode('retrieve_context', retrieveContext)
  .addNode('fetch_weak_topics', fetchWeakTopics)
  .addNode('rerank_chunks', rerankChunks)
  .addNode('generate_questions', generateQuestions)
  .addNode('validate_questions', validateQuestions)
  .addNode('handle_error', handleError)
  
  .addEdge(START, 'retrieve_context')
  .addConditionalEdges('retrieve_context', routeAfterRetrieve, {
    fetch_weak_topics: 'fetch_weak_topics',
    rerank_chunks: 'rerank_chunks'
  })
  .addEdge('fetch_weak_topics', 'rerank_chunks')
  .addEdge('rerank_chunks', 'generate_questions')
  .addConditionalEdges('generate_questions', routeAfterGeneration, {
    validate: 'validate_questions',
    error: 'handle_error'
  })
  .addEdge('validate_questions', END)
  .addEdge('handle_error', END)
  .compile();

export async function generateQuizWithAgent(
  input: Pick<QuizGenerationState, 'userId' | 'documentIds' | 'roomId' | 'count' | 'difficultyMix' | 'topicFocus' | 'weakTopics' | 'isAdaptive'>
): Promise<{
  questions: QuizGenerationState['generatedQuestions'];
  quizTitle: string;
  topicsCovered: string[];
  modelUsed: string;
  tokensUsed: number;
}> {
  const result = await quizGenerationGraph.invoke({
    userId: input.userId,
    documentIds: input.documentIds,
    roomId: input.roomId,
    count: input.count,
    difficultyMix: input.difficultyMix,
    topicFocus: input.topicFocus,
    weakTopics: input.weakTopics,
    isAdaptive: input.isAdaptive,
  });

  if (result.error) {
    throw new AppError(result.error, 422);
  }

  return {
    questions: result.generatedQuestions,
    quizTitle: result.quizTitle,
    topicsCovered: result.topicsCovered,
    modelUsed: result.modelUsed,
    tokensUsed: result.tokensUsed,
  };
}
