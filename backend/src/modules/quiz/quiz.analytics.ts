import * as crypto from 'crypto';
import { db } from '../../shared/db/mysql.js';
import { logger } from '../../shared/logger/logger.js';

// ── Update topic mastery after quiz attempt ────────────────────────────────
export async function updateTopicMastery(params: {
  userId: string;
  syllabusId: string | null;
  attemptId: string;
  answers: Array<{
    questionId: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isCorrect: boolean;
  }>;
}): Promise<void> {
  const { userId, syllabusId, answers } = params;

  if (answers.length === 0) return;

  // Resolve syllabusId to satisfy the NOT NULL foreign key constraint
  let activeSyllabusId = syllabusId;
  if (!activeSyllabusId) {
    try {
      const existingSyllabuses = await db.query<any[]>(
        `SELECT id FROM syllabuses WHERE user_id = ? LIMIT 1`,
        [userId]
      );
      if (existingSyllabuses.length > 0) {
        activeSyllabusId = existingSyllabuses[0].id;
      } else {
        activeSyllabusId = crypto.randomUUID();
        await db.query(
          `INSERT INTO syllabuses (id, user_id, subject, topics, total_topics, covered_topics) VALUES (?, ?, 'General Study', '[]', 0, 0)`,
          [activeSyllabusId, userId]
        );
        logger.info('Created default syllabus for topic mastery', { userId, syllabusId: activeSyllabusId });
      }
    } catch (err) {
      logger.error('Failed to resolve/create syllabus in updateTopicMastery', err);
      return; // Break early if foreign key cannot be satisfied
    }
  }

  // 1. Group answers by topic
  const topicsMap = new Map<string, Array<{ difficulty: string; isCorrect: boolean }>>();
  for (const ans of answers) {
    const topic = ans.topic || 'General';
    if (!topicsMap.has(topic)) {
      topicsMap.set(topic, []);
    }
    topicsMap.get(topic)!.push({ difficulty: ans.difficulty, isCorrect: ans.isCorrect });
  }

  // Difficulty weights
  const weights: Record<string, number> = { easy: 1.0, medium: 1.5, hard: 2.0 };

  let topicsUpdated = 0;
  let weakTopicsCount = 0;

  // 2. Compute mastery score and upsert for each topic
  for (const [topicName, topicAnswers] of topicsMap.entries()) {
    const totalInTopic = topicAnswers.length;
    const correctInTopic = topicAnswers.filter(a => a.isCorrect).length;
    const quizAccuracy = (correctInTopic / totalInTopic) * 100;

    let sumWeights = 0;
    let sumWeightedCorrect = 0;

    for (const ta of topicAnswers) {
      const w = weights[ta.difficulty] || 1.5;
      sumWeights += w;
      if (ta.isCorrect) {
        sumWeightedCorrect += w;
      }
    }

    const newScore = (sumWeightedCorrect / sumWeights) * 100;

    try {
      // Check if entry already exists in database
      const existing = await db.query<any[]>(
        `SELECT id, mastery_score FROM topic_mastery 
         WHERE user_id = ? AND syllabus_id = ? AND topic_name = ?`,
        [userId, activeSyllabusId, topicName]
      );

      let finalMasteryScore = newScore;
      if (existing.length > 0) {
        const oldScore = Number(existing[0].mastery_score) || 0;
        // Exponential moving average: 70% old + 30% new
        finalMasteryScore = (oldScore * 0.7) + (newScore * 0.3);

        const weakFlag = finalMasteryScore < 60 ? 1 : 0;
        if (weakFlag === 1) weakTopicsCount++;

        await db.query(
          `UPDATE topic_mastery 
           SET mastery_score = ?, quiz_accuracy = ?, review_count = review_count + 1, weak_flag = ?, last_assessed_at = NOW()
           WHERE id = ?`,
          [finalMasteryScore, quizAccuracy, weakFlag, existing[0].id]
        );
      } else {
        const weakFlag = finalMasteryScore < 60 ? 1 : 0;
        if (weakFlag === 1) weakTopicsCount++;

        await db.query(
          `INSERT INTO topic_mastery 
            (id, user_id, syllabus_id, topic_name, mastery_score, quiz_accuracy, review_count, weak_flag, last_assessed_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
          [crypto.randomUUID(), userId, activeSyllabusId, topicName, finalMasteryScore, quizAccuracy, weakFlag]
        );
      }
      topicsUpdated++;
    } catch (dbErr) {
      logger.error('Failed to upsert topic mastery row', dbErr, { userId, topicName });
    }
  }

  logger.info('Topic mastery updated', { userId, topicsUpdated, weakTopicsCount });
}

// ── Compute quiz performance breakdown ────────────────────────────────────
export function computePerformanceBreakdown(answers: Array<{
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeTakenS: number | null;
}>): {
  byTopic: Record<string, { correct: number; total: number; accuracy: number }>;
  byDifficulty: Record<string, { correct: number; total: number; accuracy: number }>;
  avgTimePerQuestion: number;
  weakTopics: string[];
  strongTopics: string[];
} {
  const byTopic: Record<string, { correct: number; total: number; accuracy: number }> = {};
  const byDifficulty: Record<string, { correct: number; total: number; accuracy: number }> = {};

  let totalTime = 0;
  let timeCount = 0;

  for (const a of answers) {
    const topic = a.topic || 'General';
    if (!byTopic[topic]) {
      byTopic[topic] = { correct: 0, total: 0, accuracy: 0 };
    }
    byTopic[topic].total += 1;
    if (a.isCorrect) byTopic[topic].correct += 1;

    const diff = a.difficulty || 'medium';
    if (!byDifficulty[diff]) {
      byDifficulty[diff] = { correct: 0, total: 0, accuracy: 0 };
    }
    byDifficulty[diff].total += 1;
    if (a.isCorrect) byDifficulty[diff].correct += 1;

    if (a.timeTakenS !== null && a.timeTakenS !== undefined) {
      totalTime += a.timeTakenS;
      timeCount += 1;
    }
  }

  // Accuracies
  for (const topic of Object.keys(byTopic)) {
    const t = byTopic[topic];
    if (t) {
      t.accuracy = Math.round((t.correct / t.total) * 100);
    }
  }
  for (const diff of Object.keys(byDifficulty)) {
    const d = byDifficulty[diff];
    if (d) {
      d.accuracy = Math.round((d.correct / d.total) * 100);
    }
  }

  const weakTopics = Object.keys(byTopic).filter(t => (byTopic[t]?.accuracy ?? 0) < 60);
  const strongTopics = Object.keys(byTopic).filter(t => (byTopic[t]?.accuracy ?? 0) >= 80);
  const avgTimePerQuestion = timeCount > 0 ? Math.round(totalTime / timeCount) : 0;

  return {
    byTopic,
    byDifficulty,
    avgTimePerQuestion,
    weakTopics,
    strongTopics,
  };
}

// ── Log analytics event ───────────────────────────────────────────────────
export async function logQuizCompletedEvent(params: {
  userId: string;
  attemptId: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenS: number;
  weakTopics: string[];
}): Promise<void> {
  const { userId, attemptId, quizId, score, correctCount, totalQuestions, timeTakenS, weakTopics } = params;
  const today = new Date().toISOString().split('T')[0];

  try {
    await db.query(
      `INSERT INTO analytics_events 
        (id, user_id, event_type, entity_id, entity_type, metadata, session_date, created_at)
       VALUES (?, ?, 'quiz_completed', ?, 'quiz_attempt', ?, ?, NOW())`,
      [
        crypto.randomUUID(),
        userId,
        attemptId,
        JSON.stringify({ score, correctCount, totalQuestions, timeTakenS, weakTopics, quizId }),
        today,
      ]
    );
  } catch (err) {
    logger.error('Failed to log quiz completed event', err);
  }
}

// ── Get quiz history for a user ────────────────────────────────────────────
export async function getQuizHistory(userId: string, limit = 10): Promise<Array<{
  attemptId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeTakenS: number | null;
  completedAt: Date;
}>> {
  const rows = await db.query<any[]>(
    `SELECT qa.id as attemptId, q.title as quizTitle, qa.score, qa.total_questions as totalQuestions, 
            qa.correct_count as correctCount, qa.time_taken_s as timeTakenS, qa.completed_at as completedAt
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.user_id = ? AND qa.status = 'completed'
     ORDER BY qa.completed_at DESC LIMIT ?`,
    [userId, limit]
  );

  return rows.map(r => ({
    attemptId: r.attemptId,
    quizTitle: r.quizTitle,
    score: Number(r.score) || 0,
    totalQuestions: r.totalQuestions,
    correctCount: r.correctCount,
    timeTakenS: r.timeTakenS,
    completedAt: new Date(r.completedAt),
  }));
}

// ── Get weak areas for a user ────────────────────────────────────────────
export async function getWeakAreas(userId: string, syllabusId?: string): Promise<Array<{
  topicName: string;
  masteryScore: number;
  quizAccuracy: number;
  reviewCount: number;
  lastAssessedAt: Date | null;
}>> {
  let query = `SELECT topic_name as topicName, mastery_score as masteryScore, quiz_accuracy as quizAccuracy, 
                      review_count as reviewCount, last_assessed_at as lastAssessedAt 
               FROM topic_mastery 
               WHERE user_id = ? AND weak_flag = 1`;
  const params: any[] = [userId];

  if (syllabusId) {
    query += ` AND syllabus_id = ?`;
    params.push(syllabusId);
  }

  query += ` ORDER BY mastery_score ASC`;

  const rows = await db.query<any[]>(query, params);

  return rows.map(r => ({
    topicName: r.topicName,
    masteryScore: Number(r.masteryScore) || 0,
    quizAccuracy: Number(r.quizAccuracy) || 0,
    reviewCount: r.reviewCount,
    lastAssessedAt: r.lastAssessedAt ? new Date(r.lastAssessedAt) : null,
  }));
}
