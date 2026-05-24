import * as crypto from 'crypto';
import { db } from '../../shared/db/mysql.js';
import { redis } from '../../shared/redis/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logger/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { generateQuizWithAgent } from './quiz.agent.js';
import { getWeakAreas, getQuizHistory, computePerformanceBreakdown, updateTopicMastery, logQuizCompletedEvent } from './quiz.analytics.js';
import { QUIZ_FEEDBACK_PROMPT, QUESTION_EXPLAIN_PROMPT } from './quiz.prompts.js';
import { getLLM } from '../flashcards/flashcard.agent.js';

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_index: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface QuizSummary {
  id: string;
  title: string;
  question_count: number;
  room_id: string | null;
  topics_covered: string[];
  created_at: Date;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenS: number;
  completedAt: Date;
  answers: Array<{
    questionId: string;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    topic: string;
    difficulty: string;
  }>;
}

export class QuizService {

  // ── Generate a quiz ────────────────────────────────────────────────────
  async generateQuiz(params: {
    userId: string;
    documentIds: string[];
    roomId?: string;
    count?: number;
    difficultyMix?: { easy: number; medium: number; hard: number };
    topicFocus?: string;
    isAdaptive?: boolean;
    syllabusId?: string;
  }): Promise<{ quizId: string; questionCount: number; quizTitle: string; topicsCovered: string[] }> {
    const { userId, documentIds, roomId, topicFocus, difficultyMix, isAdaptive = false, syllabusId } = params;

    // 1. Verify document ownership
    const placeholders = documentIds.map(() => '?').join(', ');
    const ownedDocs = await db.query<any[]>(
      `SELECT id FROM documents WHERE id IN (${placeholders}) AND user_id = ? AND deleted_at IS NULL`,
      [...documentIds, userId]
    );

    if (ownedDocs.length !== documentIds.length) {
      throw new AppError('Access denied to one or more documents', 403);
    }

    // 2. Cap question count to MAX_QUIZ_QUESTIONS
    const capLimit = Number(env.MAX_QUIZ_QUESTIONS) || 30;
    const requestedCount = Math.min(params.count ?? 10, capLimit);

    // 3. Adaptive quiz setup
    let weakTopics: string[] | null = null;
    if (isAdaptive) {
      const weakAreas = await getWeakAreas(userId, syllabusId);
      weakTopics = weakAreas.map(w => w.topicName);
    }

    // 4. Generate questions via agent
    const agentResult = await generateQuizWithAgent({
      userId,
      documentIds,
      roomId: roomId || null,
      count: requestedCount,
      difficultyMix: difficultyMix || { easy: 30, medium: 50, hard: 20 },
      topicFocus: topicFocus || null,
      weakTopics,
      isAdaptive,
    });

    const quizId = crypto.randomUUID();

    // 5. Insert into quizzes table
    await db.query(
      `INSERT INTO quizzes 
        (id, user_id, room_id, document_ids, title, question_count, difficulty_mix, topic_focus, model_used, tokens_used, generation_config, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        quizId,
        userId,
        roomId || null,
        JSON.stringify(documentIds),
        agentResult.quizTitle,
        agentResult.questions.length,
        JSON.stringify(difficultyMix || { easy: 30, medium: 50, hard: 20 }),
        topicFocus ? JSON.stringify([topicFocus]) : null,
        agentResult.modelUsed,
        agentResult.tokensUsed,
        JSON.stringify({ isAdaptive, syllabusId }),
      ]
    );

    // 6. Batch insert quiz_questions in groups of 10
    const batchSize = 10;
    for (let i = 0; i < agentResult.questions.length; i += batchSize) {
      const batch = agentResult.questions.slice(i, i + batchSize);
      const questionPlaceholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW())').join(', ');
      const questionValues = batch.flatMap((q, index) => [
        crypto.randomUUID(),
        quizId,
        i + index, // question_index
        q.question,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation,
        q.topic || 'General',
        q.difficulty || 'medium',
      ]);

      await db.query(
        `INSERT INTO quiz_questions 
          (id, quiz_id, question_index, question, options, correct_answer, explanation, topic, difficulty, source_chunk_id, created_at)
         VALUES ${questionPlaceholders}`,
        questionValues
      );
    }

    // 7. Retrieve full quiz with questions to store in cache
    const savedQuestions = await db.query<any[]>(
      `SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_index ASC`,
      [quizId]
    );

    const fullQuiz = {
      id: quizId,
      user_id: userId,
      room_id: roomId || null,
      title: agentResult.quizTitle,
      question_count: agentResult.questions.length,
      topics_covered: agentResult.topicsCovered,
      questions: savedQuestions.map(q => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question_index: q.question_index,
        question: q.question,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
      })),
    };

    // Cache the full quiz structure for 24h
    try {
      await redis.set(`quiz:${quizId}`, JSON.stringify(fullQuiz), 'EX', 86400);
    } catch (err) {
      logger.error('Redis cache failed for generated quiz', err);
    }

    logger.info('Quiz generated successfully', { quizId, userId, questionsCount: fullQuiz.questions.length });

    return {
      quizId,
      questionCount: fullQuiz.questions.length,
      quizTitle: agentResult.quizTitle,
      topicsCovered: agentResult.topicsCovered,
    };
  }

  // ── Start a quiz attempt ───────────────────────────────────────────────
  async startAttempt(quizId: string, userId: string): Promise<{
    attemptId: string;
    questions: Array<Omit<QuizQuestion, 'correct_answer' | 'explanation'>>;
  }> {
    let quiz: any = null;

    try {
      const cached = await redis.get(`quiz:${quizId}`);
      if (cached) {
        quiz = JSON.parse(cached);
      }
    } catch (err) {
      logger.error('Redis fetch failed in startAttempt', err);
    }

    if (!quiz) {
      const quizRows = await db.query<any[]>(
        `SELECT * FROM quizzes WHERE id = ? AND deleted_at IS NULL`,
        [quizId]
      );
      if (quizRows.length === 0) {
        throw new AppError('Quiz not found', 404);
      }
      quiz = quizRows[0];

      const savedQuestions = await db.query<any[]>(
        `SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_index ASC`,
        [quizId]
      );
      quiz.questions = savedQuestions.map(q => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question_index: q.question_index,
        question: q.question,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
      }));
    }

    if (quiz.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const attemptId = crypto.randomUUID();

    // Insert into quiz_attempts
    await db.query(
      `INSERT INTO quiz_attempts 
        (id, quiz_id, user_id, score, total_questions, correct_count, time_taken_s, status, completed_at, created_at)
       VALUES (?, ?, ?, NULL, ?, NULL, NULL, 'in_progress', NULL, NOW())`,
      [
        attemptId,
        quizId,
        userId,
        quiz.questions.length,
      ]
    );

    // Omit correct answers and explanations for safety
    const sanitizedQuestions = quiz.questions.map((q: any) => {
      const { correct_answer, explanation, ...sanitized } = q;
      return sanitized;
    });

    return {
      attemptId,
      questions: sanitizedQuestions,
    };
  }

  // ── Submit a single answer ─────────────────────────────────────────────
  async submitAnswer(params: {
    attemptId: string;
    questionId: string;
    userId: string;
    userAnswer: 'A' | 'B' | 'C' | 'D' | null;
    timeTakenS?: number;
  }): Promise<{
    isCorrect: boolean;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
  }> {
    const { attemptId, questionId, userId, userAnswer, timeTakenS = null } = params;

    // Verify attempt ownership and state
    const attemptRows = await db.query<any[]>(
      `SELECT * FROM quiz_attempts WHERE id = ?`,
      [attemptId]
    );

    if (attemptRows.length === 0) {
      throw new AppError('Quiz attempt not found', 404);
    }

    const attempt = attemptRows[0];
    if (attempt.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }
    if (attempt.status !== 'in_progress') {
      throw new AppError('Cannot submit answers for a finalized or abandoned attempt', 400);
    }

    // Verify the question belongs to the quiz of this attempt
    const questionRows = await db.query<any[]>(
      `SELECT * FROM quiz_questions WHERE id = ? AND quiz_id = ?`,
      [questionId, attempt.quiz_id]
    );

    if (questionRows.length === 0) {
      throw new AppError('Question not found in this quiz', 404);
    }

    const question = questionRows[0];

    // Enforce single-answer constraint
    const existing = await db.query<any[]>(
      `SELECT id FROM quiz_answers WHERE attempt_id = ? AND question_id = ?`,
      [attemptId, questionId]
    );
    if (existing.length > 0) {
      throw new AppError('Question already answered in this attempt', 400);
    }

    const isCorrect = userAnswer === question.correct_answer;

    await db.query(
      `INSERT INTO quiz_answers (id, attempt_id, question_id, user_answer, is_correct, time_taken_s, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        crypto.randomUUID(),
        attemptId,
        questionId,
        userAnswer,
        isCorrect ? 1 : 0,
        timeTakenS,
      ]
    );

    return {
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
    };
  }

  // ── Complete attempt ───────────────────────────────────────────────────
  async completeAttempt(attemptId: string, userId: string): Promise<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeTakenS: number;
    breakdown: ReturnType<typeof computePerformanceBreakdown>;
    feedback: string;
    weakTopics: string[];
  }> {
    const attemptRows = await db.query<any[]>(
      `SELECT * FROM quiz_attempts WHERE id = ?`,
      [attemptId]
    );

    if (attemptRows.length === 0) {
      throw new AppError('Quiz attempt not found', 404);
    }

    const attempt = attemptRows[0];
    if (attempt.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }
    if (attempt.status !== 'in_progress') {
      throw new AppError('Quiz attempt is not in progress', 400);
    }

    // Fetch quiz answers and metadata for the attempt
    const quizAnswers = await db.query<any[]>(
      `SELECT qa.*, qq.topic, qq.difficulty FROM quiz_answers qa
       JOIN quiz_questions qq ON qa.question_id = qq.id
       WHERE qa.attempt_id = ?`,
      [attemptId]
    );

    const totalQuestions = attempt.total_questions;
    const correctCount = quizAnswers.filter(a => a.is_correct === 1).length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const timeTakenS = Math.floor((Date.now() - new Date(attempt.created_at).getTime()) / 1000);

    // Update attempt record
    await db.query(
      `UPDATE quiz_attempts 
       SET status = 'completed', score = ?, correct_count = ?, time_taken_s = ?, completed_at = NOW() 
       WHERE id = ?`,
      [score, correctCount, timeTakenS, attemptId]
    );

    // Compute performance aggregations
    const breakdown = computePerformanceBreakdown(
      quizAnswers.map(a => ({
        topic: a.topic,
        difficulty: a.difficulty,
        isCorrect: a.is_correct === 1,
        timeTakenS: a.time_taken_s,
      }))
    );

    // Retrieve syllabusId if it exists in generation config
    const quizRows = await db.query<any[]>(
      `SELECT generation_config, title FROM quizzes WHERE id = ?`,
      [attempt.quiz_id]
    );
    const quiz = quizRows[0];
    let syllabusId: string | null = null;
    if (quiz && quiz.generation_config) {
      const config = typeof quiz.generation_config === 'string' ? JSON.parse(quiz.generation_config) : quiz.generation_config;
      syllabusId = config.syllabusId || null;
    }

    // Update topic mastery in database
    await updateTopicMastery({
      userId,
      syllabusId,
      attemptId,
      answers: quizAnswers.map(a => ({
        questionId: a.question_id,
        topic: a.topic,
        difficulty: a.difficulty,
        isCorrect: a.is_correct === 1,
      })),
    });

    // Generate AI feedback
    let feedback = '';
    const feedbackCacheKey = `quiz:feedback:${attemptId}`;
    try {
      const cachedFeedback = await redis.get(feedbackCacheKey);
      if (cachedFeedback) {
        feedback = cachedFeedback;
      }
    } catch (err) {
      logger.error('Redis fetch failed for feedback cache', err);
    }

    if (!feedback) {
      try {
        const modelName = env.CHAT_MODEL || 'gpt-4o';
        const llm = getLLM(modelName);
        const feedbackPrompt = await QUIZ_FEEDBACK_PROMPT.format({
          quiz_title: quiz?.title || 'Study Quiz',
          score: Math.round(score),
          correct: correctCount,
          total: totalQuestions,
          time_taken: (timeTakenS / 60).toFixed(1),
          wrong_topics: breakdown.weakTopics.length > 0 ? breakdown.weakTopics.join(', ') : 'None',
          correct_topics: breakdown.strongTopics.length > 0 ? breakdown.strongTopics.join(', ') : 'None',
        });

        const llmFeedback = await llm.invoke(feedbackPrompt);
        feedback = typeof llmFeedback.content === 'string' ? llmFeedback.content : JSON.stringify(llmFeedback.content);

        await redis.set(feedbackCacheKey, feedback, 'EX', 86400); // cache for 24h
      } catch (err) {
        logger.error('Failed to generate AI feedback', err);
        feedback = 'Great job finishing the quiz! Review your results below to identify topics to focus on.';
      }
    }

    // Log to analytics_events
    await logQuizCompletedEvent({
      userId,
      attemptId,
      quizId: attempt.quiz_id,
      score,
      correctCount,
      totalQuestions,
      timeTakenS,
      weakTopics: breakdown.weakTopics,
    });

    return {
      score,
      correctCount,
      totalQuestions,
      timeTakenS,
      breakdown,
      feedback,
      weakTopics: breakdown.weakTopics,
    };
  }

  // ── Abandon attempt ────────────────────────────────────────────────────
  async abandonAttempt(attemptId: string, userId: string): Promise<void> {
    const attemptRows = await db.query<any[]>(
      `SELECT * FROM quiz_attempts WHERE id = ?`,
      [attemptId]
    );

    if (attemptRows.length === 0) {
      throw new AppError('Quiz attempt not found', 404);
    }

    const attempt = attemptRows[0];
    if (attempt.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }
    if (attempt.status !== 'in_progress') {
      throw new AppError('Attempt already finalized', 400);
    }

    await db.query(
      `UPDATE quiz_attempts SET status = 'abandoned' WHERE id = ?`,
      [attemptId]
    );
  }

  // ── Get attempt results ────────────────────────────────────────────────
  async getAttemptResult(attemptId: string, userId: string): Promise<AttemptResult> {
    const attemptRows = await db.query<any[]>(
      `SELECT * FROM quiz_attempts WHERE id = ?`,
      [attemptId]
    );

    if (attemptRows.length === 0) {
      throw new AppError('Quiz attempt not found', 404);
    }

    const attempt = attemptRows[0];
    if (attempt.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }
    if (attempt.status !== 'completed') {
      throw new AppError('Attempt results are only available for completed attempts', 400);
    }

    // Fetch answers joined with questions
    const answerRows = await db.query<any[]>(
      `SELECT qa.question_id, qa.user_answer, qa.is_correct, qq.question, qq.options, qq.correct_answer, qq.explanation, qq.topic, qq.difficulty 
       FROM quiz_answers qa
       JOIN quiz_questions qq ON qa.question_id = qq.id
       WHERE qa.attempt_id = ?
       ORDER BY qq.question_index ASC`,
      [attemptId]
    );

    return {
      attemptId: attempt.id,
      quizId: attempt.quiz_id,
      score: Number(attempt.score) || 0,
      correctCount: attempt.correct_count,
      totalQuestions: attempt.total_questions,
      timeTakenS: attempt.time_taken_s,
      completedAt: new Date(attempt.completed_at),
      answers: answerRows.map(row => ({
        questionId: row.question_id,
        question: row.question,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
        userAnswer: row.user_answer,
        correctAnswer: row.correct_answer,
        isCorrect: row.is_correct === 1,
        explanation: row.explanation,
        topic: row.topic,
        difficulty: row.difficulty,
      })),
    };
  }

  // ── List quizzes ───────────────────────────────────────────────────────
  async listQuizzes(userId: string, roomId?: string): Promise<QuizSummary[]> {
    let query = `SELECT id, title, question_count, room_id, created_at, document_ids FROM quizzes WHERE user_id = ? AND deleted_at IS NULL`;
    const params: any[] = [userId];

    if (roomId) {
      query += ` AND room_id = ?`;
      params.push(roomId);
    }
    query += ` ORDER BY created_at DESC`;

    const rows = await db.query<any[]>(query, params);

    const summaries: QuizSummary[] = [];
    for (const r of rows) {
      // Fetch unique topics covered dynamically from questions
      const topicsRows = await db.query<any[]>(
        `SELECT DISTINCT topic FROM quiz_questions WHERE quiz_id = ?`,
        [r.id]
      );
      summaries.push({
        id: r.id,
        title: r.title,
        question_count: r.question_count,
        room_id: r.room_id,
        topics_covered: topicsRows.map(tr => tr.topic || 'General'),
        created_at: new Date(r.created_at),
      });
    }

    return summaries;
  }

  // ── Get quiz history ───────────────────────────────────────────────────
  async getHistory(userId: string): Promise<ReturnType<typeof getQuizHistory>> {
    return getQuizHistory(userId);
  }

  // ── Get weak areas ────────────────────────────────────────────────────
  async getWeakAreas(userId: string, syllabusId?: string): Promise<ReturnType<typeof getWeakAreas>> {
    return getWeakAreas(userId, syllabusId);
  }
}
