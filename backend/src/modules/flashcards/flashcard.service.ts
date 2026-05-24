import * as crypto from 'crypto';
import { db } from '../../shared/db/mysql.js';
import { redis } from '../../shared/redis/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { generateFlashcardsWithAgent, getLLM } from './flashcard.agent.js';
import { FLASHCARD_EXPLAIN_PROMPT } from './flashcard.prompts.js';

export interface DeckSummary {
  id: string;
  user_id: string;
  room_id: string | null;
  title: string;
  card_count: number;
  topics_covered: string[];
  created_at: Date;
}

export interface DeckWithCards extends DeckSummary {
  flashcards: FlashcardRecord[];
  document_ids: string[];
  model_used: string;
  tokens_used: number | null;
}

export interface FlashcardRecord {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery_level: 'new' | 'learning' | 'review' | 'mastered';
  review_count: number;
  next_review_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class FlashcardService {

  // ── Generate a new deck ────────────────────────────────────────────────
  async generateDeck(params: {
    userId: string;
    documentIds: string[];
    roomId?: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    topicFocus?: string;
  }): Promise<{ deckId: string; cardCount: number; deckTitle: string; topicsCovered: string[] }> {
    const { userId, documentIds, roomId, topicFocus, difficulty = 'mixed' } = params;

    // 1. Verify that all documentIds belong to the userId and are not deleted
    const placeholders = documentIds.map(() => '?').join(', ');
    const ownedDocs = await db.query<any[]>(
      `SELECT id FROM documents WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`,
      [...documentIds, userId]
    );

    if (ownedDocs.length !== documentIds.length) {
      throw new AppError('Access denied to one or more documents', 403);
    }

    // 2. Cap count to MAX_FLASHCARDS_PER_DECK
    const capLimit = Number(env.MAX_FLASHCARDS_PER_DECK) || 50;
    const requestedCount = Math.min(params.count ?? 20, capLimit);

    // 3. Invoke LangGraph generation agent
    const agentResult = await generateFlashcardsWithAgent({
      userId,
      documentIds,
      roomId: roomId || null,
      count: requestedCount,
      difficulty,
      topicFocus: topicFocus || null,
    });

    const deckId = crypto.randomUUID();

    // 4. Save the deck to MySQL
    await db.query(
      `INSERT INTO flashcard_decks 
        (id, user_id, room_id, document_ids, title, card_count, model_used, tokens_used, generation_config, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        deckId,
        userId,
        roomId || null,
        JSON.stringify(documentIds),
        agentResult.deckTitle,
        agentResult.cards.length,
        agentResult.modelUsed,
        agentResult.tokensUsed,
        JSON.stringify({ difficulty, topicFocus, count: requestedCount }),
      ]
    );

    // 5. Batch insert cards in groups of 20
    const batchSize = 20;
    for (let i = 0; i < agentResult.cards.length; i += batchSize) {
      const batch = agentResult.cards.slice(i, i + batchSize);
      const cardPlaceholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NOW(), NOW())').join(', ');
      const cardValues = batch.flatMap(card => [
        crypto.randomUUID(),
        deckId,
        userId,
        card.front,
        card.back,
        card.topic || 'General',
        card.difficulty || 'medium',
        'new',
      ]);

      await db.query(
        `INSERT INTO flashcards 
          (id, deck_id, user_id, front, back, topic, difficulty, mastery_level, review_count, next_review_at, source_chunk_id, created_at, updated_at)
         VALUES ${cardPlaceholders}`,
        cardValues
      );
    }

    // 6. Update actual card count on the deck (redundancy check)
    const cardsInDb = await db.query<any[]>(
      `SELECT COUNT(*) as count FROM flashcards WHERE deck_id = ?`,
      [deckId]
    );
    const finalCardCount = cardsInDb[0]?.count || agentResult.cards.length;
    await db.query(
      `UPDATE flashcard_decks SET card_count = ? WHERE id = ?`,
      [finalCardCount, deckId]
    );

    // 7. Invalidate Redis cache keys
    await redis.del(`decks:${userId}:all`);
    if (roomId) {
      await redis.del(`decks:${userId}:${roomId}`);
    }

    logger.info('Deck generated successfully', { deckId, userId, cardCount: finalCardCount, tokensUsed: agentResult.tokensUsed });

    return {
      deckId,
      cardCount: finalCardCount,
      deckTitle: agentResult.deckTitle,
      topicsCovered: agentResult.topicsCovered,
    };
  }

  // ── List decks for a user ──────────────────────────────────────────────
  async listDecks(userId: string, roomId?: string): Promise<DeckSummary[]> {
    const cacheKey = `decks:${userId}:${roomId ?? 'all'}`;
    const ttl = Number(env.REDIS_CACHE_TTL_SECONDS) || 3600;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.error('Redis read failed in listDecks', err);
    }

    let query = `SELECT id, user_id, room_id, title, card_count, created_at FROM flashcard_decks WHERE user_id = ? AND deleted_at IS NULL`;
    const params: any[] = [userId];

    if (roomId) {
      query += ` AND room_id = ?`;
      params.push(roomId);
    }
    query += ` ORDER BY created_at DESC`;

    const rows = await db.query<any[]>(query, params);

    const summaries: DeckSummary[] = [];
    for (const r of rows) {
      // Find topics covered dynamically
      const topicsRows = await db.query<any[]>(
        `SELECT DISTINCT topic FROM flashcards WHERE deck_id = ?`,
        [r.id]
      );
      summaries.push({
        id: r.id,
        user_id: r.user_id,
        room_id: r.room_id,
        title: r.title,
        card_count: r.card_count,
        topics_covered: topicsRows.map(tr => tr.topic || 'General'),
        created_at: new Date(r.created_at),
      });
    }

    try {
      await redis.set(cacheKey, JSON.stringify(summaries), 'EX', ttl);
    } catch (err) {
      logger.error('Redis write failed in listDecks', err);
    }

    return summaries;
  }

  // ── Get deck with all cards ────────────────────────────────────────────
  async getDeck(deckId: string, userId: string): Promise<DeckWithCards> {
    const cacheKey = `deck:${deckId}`;
    const ttl = Number(env.REDIS_CACHE_TTL_SECONDS) || 3600;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.user_id === userId) {
          return parsed;
        }
      }
    } catch (err) {
      logger.error('Redis read failed in getDeck', err);
    }

    const deckRows = await db.query<any[]>(
      `SELECT * FROM flashcard_decks WHERE id = ?`,
      [deckId]
    );

    if (deckRows.length === 0) {
      throw new AppError('Deck not found', 404);
    }

    const deck = deckRows[0];
    if (deck.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const cardRows = await db.query<any[]>(
      `SELECT * FROM flashcards WHERE deck_id = ?  ORDER BY created_at ASC`,
      [deckId]
    );

    const documentIds = typeof deck.document_ids === 'string' ? JSON.parse(deck.document_ids) : deck.document_ids;

    const deckWithCards: DeckWithCards = {
      id: deck.id,
      user_id: deck.user_id,
      room_id: deck.room_id,
      title: deck.title,
      card_count: deck.card_count,
      document_ids: documentIds,
      model_used: deck.model_used,
      tokens_used: deck.tokens_used,
      topics_covered: Array.from(new Set(cardRows.map(c => c.topic || 'General'))),
      created_at: new Date(deck.created_at),
      flashcards: cardRows.map(c => ({
        id: c.id,
        deck_id: c.deck_id,
        user_id: c.user_id,
        front: c.front,
        back: c.back,
        topic: c.topic,
        difficulty: c.difficulty,
        mastery_level: c.mastery_level,
        review_count: c.review_count,
        next_review_at: c.next_review_at ? new Date(c.next_review_at) : null,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
      })),
    };

    try {
      await redis.set(cacheKey, JSON.stringify(deckWithCards), 'EX', ttl);
    } catch (err) {
      logger.error('Redis write failed in getDeck', err);
    }

    return deckWithCards;
  }

  // ── Review a card (spaced repetition update) ───────────────────────────
  async reviewCard(params: {
    cardId: string;
    userId: string;
    result: 'correct' | 'incorrect' | 'skipped';
  }): Promise<{ nextReviewAt: Date; masteryLevel: string }> {
    const { cardId, userId, result } = params;

    const cardRows = await db.query<any[]>(
      `SELECT * FROM flashcards WHERE id = ? AND deleted_at IS NULL`,
      [cardId]
    );

    if (cardRows.length === 0) {
      throw new AppError('Card not found', 404);
    }

    const card = cardRows[0];
    if (card.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const currentMastery = card.mastery_level;
    let nextMastery = currentMastery;

    if (result === 'correct') {
      if (currentMastery === 'new') nextMastery = 'learning';
      else if (currentMastery === 'learning') nextMastery = 'review';
      else if (currentMastery === 'review') nextMastery = 'mastered';
    } else if (result === 'incorrect') {
      nextMastery = 'new';
    } else if (result === 'skipped') {
      nextMastery = currentMastery;
    }

    let intervalDays = 1;
    if (nextMastery === 'learning') intervalDays = 3;
    else if (nextMastery === 'review') intervalDays = 7;
    else if (nextMastery === 'mastered') intervalDays = 21;

    const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

    // Update MySQL
    await db.query(
      `UPDATE flashcards 
       SET mastery_level = ?, next_review_at = ?, review_count = review_count + 1, updated_at = NOW() 
       WHERE id = ?`,
      [nextMastery, nextReviewAt, cardId]
    );

    // Invalidate deck cache
    await redis.del(`deck:${card.deck_id}`);

    // Log analytics event
    const analyticsId = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `INSERT INTO analytics_events 
        (id, user_id, event_type, entity_id, entity_type, metadata, session_date, created_at)
       VALUES (?, ?, 'flashcard_reviewed', ?, 'flashcard', ?, ?, NOW())`,
      [
        analyticsId,
        userId,
        cardId,
        JSON.stringify({ result, masteryLevel: nextMastery, deckId: card.deck_id }),
        today,
      ]
    );

    return {
      nextReviewAt,
      masteryLevel: nextMastery,
    };
  }

  // ── Get cards due for review (spaced repetition queue) ────────────────
  async getDueCards(userId: string, limit = 20): Promise<FlashcardRecord[]> {
    const rows = await db.query<any[]>(
      `SELECT * FROM flashcards 
       WHERE user_id = ? 
         AND (next_review_at IS NULL OR next_review_at <= NOW()) 
         AND mastery_level != 'mastered' 
         AND deleted_at IS NULL
       ORDER BY FIELD(mastery_level, 'new', 'learning', 'review'), next_review_at ASC 
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(c => ({
      id: c.id,
      deck_id: c.deck_id,
      user_id: c.user_id,
      front: c.front,
      back: c.back,
      topic: c.topic,
      difficulty: c.difficulty,
      mastery_level: c.mastery_level,
      review_count: c.review_count,
      next_review_at: c.next_review_at ? new Date(c.next_review_at) : null,
      created_at: new Date(c.created_at),
      updated_at: new Date(c.updated_at),
    }));
  }

  // ── Get AI explanation for a card ─────────────────────────────────────
  async explainCard(cardId: string, userId: string): Promise<{ explanation: string }> {
    const cardRows = await db.query<any[]>(
      `SELECT * FROM flashcards WHERE id = ? AND deleted_at IS NULL`,
      [cardId]
    );

    if (cardRows.length === 0) {
      throw new AppError('Card not found', 404);
    }

    const card = cardRows[0];
    if (card.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const cacheKey = `explain:${cardId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return { explanation: cached };
      }
    } catch (err) {
      logger.error('Redis read failed in explainCard', err);
    }

    const modelName = env.CHAT_MODEL || 'gpt-4o';
    const llm = getLLM(modelName);
    const prompt = await FLASHCARD_EXPLAIN_PROMPT.format({
      front: card.front,
      back: card.back,
      topic: card.topic || 'General',
    });

    const response = await llm.invoke(prompt);
    const explanation = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    try {
      // Cache explanations for 24h
      await redis.set(cacheKey, explanation, 'EX', 86400);
    } catch (err) {
      logger.error('Redis write failed in explainCard', err);
    }

    return { explanation };
  }

  // ── Delete a deck (soft) ───────────────────────────────────────────────
  async deleteDeck(deckId: string, userId: string): Promise<void> {
    const deckRows = await db.query<any[]>(
      `SELECT * FROM flashcard_decks WHERE id = ? AND deleted_at IS NULL`,
      [deckId]
    );

    if (deckRows.length === 0) {
      throw new AppError('Deck not found', 404);
    }

    const deck = deckRows[0];
    if (deck.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Soft delete the deck
    await db.query(
      `UPDATE flashcard_decks SET deleted_at = NOW() WHERE id = ?`,
      [deckId]
    );

    // Soft delete all cards in the deck
    await db.query(
      `UPDATE flashcards SET deleted_at = NOW() WHERE deck_id = ?`,
      [deckId]
    );

    // Clear caches
    await redis.del(`deck:${deckId}`);
    await redis.del(`decks:${userId}:all`);
    if (deck.room_id) {
      await redis.del(`decks:${userId}:${deck.room_id}`);
    }

    // Clear explanation caches for all cards in this deck
    const cards = await db.query<any[]>(
      `SELECT id FROM flashcards WHERE deck_id = ?`,
      [deckId]
    );
    for (const card of cards) {
      await redis.del(`explain:${card.id}`);
    }

    logger.info('Deck soft deleted successfully', { deckId, userId });
  }
}
