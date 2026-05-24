import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from '../../config/env.js';
import { db } from '../../shared/db/mysql.js';
import { QdrantClient } from '../../shared/qdrant/qdrant.js';
import { embedTexts } from '../../ai/rag/embeddings.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { FLASHCARD_GENERATION_PROMPT } from './flashcard.prompts.js';

// Define the state annotation schema using modern LangGraph Annotation.Root
export const FlashcardGenerationStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  documentIds: Annotation<string[]>(),
  roomId: Annotation<string | null>(),
  count: Annotation<number>(),
  difficulty: Annotation<'easy' | 'medium' | 'hard' | 'mixed'>(),
  topicFocus: Annotation<string | null>(),

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

  generatedCards: Annotation<Array<{
    front: string;
    back: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>>({
    reducer: (x, y) => y,
    default: () => [],
  }),
  deckTitle: Annotation<string>({
    reducer: (x, y) => y,
    default: () => 'Flashcard Deck',
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

export type FlashcardGenerationState = typeof FlashcardGenerationStateAnnotation.State;

// Helper to instantiate the appropriate model
export function getLLM(modelName: string, temperature = 0.3) {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  const googleModelName = modelName.startsWith('gemini') ? modelName : 'gemini-3.5-flash';
  
  const fields: any = {
    model: googleModelName,
    temperature,
  };
  if (apiKey) {
    fields.apiKey = apiKey;
  }
  return new ChatGoogleGenerativeAI(fields);
}

// Node 1: retrieve_context
async function retrieveContext(state: FlashcardGenerationState) {
  const { userId, documentIds, roomId, topicFocus } = state;
  const query = topicFocus || 'key concepts definitions formulas';
  const limit = 20;
  
  logger.info('retrieve_context node running', { userId, documentIds, query });
  
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
    logger.error('Qdrant search failed, falling back to database retrieval', err);
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
    logger.error('Database retrieval failed', dbErr);
    return { retrievedChunks: [], error: 'Failed to retrieve study material context.' };
  }
}

// Node 2: rerank_chunks
async function rerankChunks(state: FlashcardGenerationState) {
  logger.info('rerank_chunks node running', { retrieved: state.retrievedChunks.length });
  // Pass-through reranker using Qdrant similarity scores and slicing to top 8
  const rerankedChunks = state.retrievedChunks.slice(0, 8);
  const context = rerankedChunks.map(c => c.content).join('\n\n---\n\n');
  return { rerankedChunks, context };
}

// Node 3: generate_flashcards
async function generateFlashcards(state: FlashcardGenerationState) {
  if (state.error) return {};

  const modelName = env.FLASHCARD_GENERATION_MODEL || 'gemini-3.5-flash';
  logger.info('generate_flashcards node running', { modelName, count: state.count });
  
  try {
    const llm = getLLM(modelName);
    const prompt = await FLASHCARD_GENERATION_PROMPT.format({
      count: state.count,
      context: state.context,
      topic_focus: state.topicFocus || 'General summary of content',
      difficulty: state.difficulty
    });

    const response = await llm.invoke(prompt);
    const contentText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    
    // Parse response
    let cleaned = contentText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
    }
    
    const data = JSON.parse(cleaned);
    const generatedCards = Array.isArray(data.flashcards) ? data.flashcards : [];
    const deckTitle = data.deck_title || 'Flashcard Deck';
    const topicsCovered = Array.isArray(data.topics_covered) ? data.topics_covered : [];
    
    const tokensUsed = (response as any).usage_metadata?.total_tokens || Math.ceil(contentText.length / 4);

    return {
      generatedCards,
      deckTitle,
      topicsCovered,
      modelUsed: modelName,
      tokensUsed
    };
  } catch (err: any) {
    logger.error('LLM invocation or parsing failed during flashcard generation', err);
    return { error: `LLM generation error: ${err.message}` };
  }
}

// Node 4: validate_output
async function validateOutput(state: FlashcardGenerationState) {
  if (state.error) return {};

  logger.info('validate_output node running', { cardsCount: state.generatedCards.length });
  
  const minCount = Math.floor(state.count * 0.8);
  const validCards = state.generatedCards.filter(
    card => card.front && card.front.trim() && card.back && card.back.trim()
  );

  if (validCards.length < 3) {
    return { error: 'Insufficient content generated' };
  }

  // Limit to original requested count if LLM over-generated
  return {
    generatedCards: validCards.slice(0, state.count)
  };
}

// Node 5: handle_error
async function handleError(state: FlashcardGenerationState) {
  logger.error('Error occurred in flashcard LangGraph execution', { error: state.error });
  return {};
}

// Route after generation depending on whether there's an error
function routeAfterGeneration(state: FlashcardGenerationState) {
  if (state.error) {
    return 'error';
  }
  return 'validate';
}

// Build and compile the graph
export const flashcardGenerationGraph = new StateGraph(FlashcardGenerationStateAnnotation)
  .addNode('retrieve_context', retrieveContext)
  .addNode('rerank_chunks', rerankChunks)
  .addNode('generate_flashcards', generateFlashcards)
  .addNode('validate_output', validateOutput)
  .addNode('handle_error', handleError)
  .addEdge(START, 'retrieve_context')
  .addEdge('retrieve_context', 'rerank_chunks')
  .addEdge('rerank_chunks', 'generate_flashcards')
  .addConditionalEdges('generate_flashcards', routeAfterGeneration, {
    validate: 'validate_output',
    error: 'handle_error',
  })
  .addEdge('validate_output', END)
  .addEdge('handle_error', END)
  .compile();

export async function generateFlashcardsWithAgent(
  input: Pick<FlashcardGenerationState, 'userId' | 'documentIds' | 'roomId' | 'count' | 'difficulty' | 'topicFocus'>
): Promise<{
  cards: FlashcardGenerationState['generatedCards'];
  deckTitle: string;
  topicsCovered: string[];
  modelUsed: string;
  tokensUsed: number;
}> {
  const result = await flashcardGenerationGraph.invoke({
    userId: input.userId,
    documentIds: input.documentIds,
    roomId: input.roomId,
    count: input.count,
    difficulty: input.difficulty,
    topicFocus: input.topicFocus,
  });

  if (result.error) {
    throw new AppError(result.error, 422);
  }

  return {
    cards: result.generatedCards,
    deckTitle: result.deckTitle,
    topicsCovered: result.topicsCovered,
    modelUsed: result.modelUsed,
    tokensUsed: result.tokensUsed,
  };
}
