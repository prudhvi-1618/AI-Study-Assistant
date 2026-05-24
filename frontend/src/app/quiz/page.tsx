'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  X,
  RefreshCw,
  Loader2,
  Sparkles,
  Check,
  FileText,
  Clock,
  Trophy,
  History,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';
import Link from 'next/link';

// Sidebar & Global Nav Components
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/AuthProvider';
import { apiFetch } from '@/lib/api';

// --- Type Definitions ---
interface Question {
  id: string;
  quiz_id: string;
  question_index: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface QuizSummary {
  id: string;
  title: string;
  question_count: number;
  topics_covered: string[];
  created_at: string;
}

interface AttemptSummary {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  score: number | null;
  correct_count: number | null;
  total_questions: number;
  time_taken_s: number | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  completed_at: string | null;
}

interface HistoryItem {
  id: string; // attemptId
  quizId: string;
  title: string; // quiz title
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenS: number;
  completedAt: string;
}

interface AnswerEvaluation {
  isCorrect: boolean;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  userAnswer: 'A' | 'B' | 'C' | 'D' | null;
}

export default function QuizArenaPage() {
  const { user } = useAuth();
  const name = user?.name || 'User';

  // Screen views: 'setup' | 'attempt' | 'result' | 'history'
  const [view, setView] = useState<'setup' | 'attempt' | 'result' | 'history'>('setup');

  // --- Setup / Configuration States ---
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isAdaptive, setIsAdaptive] = useState<boolean>(false);
  const [topicFocus, setTopicFocus] = useState<string>('');
  const [difficultyMix, setDifficultyMix] = useState<{ easy: number; medium: number; hard: number }>({
    easy: 30,
    medium: 50,
    hard: 20
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // --- Active Attempt States ---
  const [attemptId, setAttemptId] = useState<string>('');
  const [activeQuizId, setActiveQuizId] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState<string>('Study Quiz');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  // Store results of answered questions: { [questionId]: AnswerEvaluation }
  const [evaluations, setEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // --- Results / Score States ---
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeTakenS: number;
    feedback: string;
    breakdown: {
      topics: Record<string, { total: number; correct: number }>;
      difficulties: Record<string, { total: number; correct: number }>;
      weakTopics: string[];
      strongTopics: string[];
    };
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
  } | null>(null);

  // --- History States ---
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);

  // Fetch documents for the setup screen
  useEffect(() => {
    if (view === 'setup') {
      const fetchDocs = async () => {
        try {
          const data = await apiFetch<{ documents: any[] }>('/upload/documents');
          const readyDocs = (data.documents || []).filter((doc: any) => doc.status === 'ready');   
          setDocuments(readyDocs);
        } catch (err) {
          console.error('Failed to fetch documents:', err);
        }
      };
      fetchDocs();

      // Fetch weak areas to recommend adaptive mode
      const fetchWeak = async () => {
        try {
          const data = await apiFetch<{ weakAreas: any[] }>('/quiz/weak-areas');
          setWeakAreas(data.weakAreas || []);
        } catch (err) {
          console.error('Failed to fetch weak areas:', err);
        }
      };
      fetchWeak();
    }
  }, [view]);

  // Fetch history list when history view is open
  useEffect(() => {
    if (view === 'history') {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const data = await apiFetch<{ history: any[] }>('/quiz/history');
          const mapped = (data.history || []).map((item: any) => ({
            id: item.attemptId,
            quizId: item.quizId,
            title: item.title,
            score: Math.round(item.score || 0),
            correctCount: item.correctCount,
            totalQuestions: item.totalQuestions,
            timeTakenS: item.timeTakenS,
            completedAt: new Date(item.completedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }));
          setHistoryList(mapped);
        } catch (err) {
          console.error('Failed to fetch quiz history:', err);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [view]);

  // Active quiz attempt timer
  useEffect(() => {
    if (view !== 'attempt') return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [view]);

  // Format time spent
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Adjust difficulty mixes dynamically
  const applyPreset = (preset: 'balanced' | 'beginner' | 'advanced') => {
    if (preset === 'balanced') {
      setDifficultyMix({ easy: 30, medium: 50, hard: 20 });
    } else if (preset === 'beginner') {
      setDifficultyMix({ easy: 60, medium: 30, hard: 10 });
    } else if (preset === 'advanced') {
      setDifficultyMix({ easy: 10, medium: 40, hard: 50 });
    }
  };

  // --- Handlers ---
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) return;

    setIsGenerating(true);
    try {
      // 1. Generate Quiz
      const genResult = await apiFetch<{ quizId: string; quizTitle: string }>(
        '/quiz/generate',
        {
          method: 'POST',
          body: {
            documentIds: selectedDocIds,
            count: questionCount,
            difficultyMix,
            topicFocus: topicFocus || null,
            isAdaptive,
          },
        }
      );

      setQuizTitle(genResult.quizTitle);
      setActiveQuizId(genResult.quizId);

      // 2. Start Attempt
      const startResult = await apiFetch<{ attemptId: string; questions: Question[] }>(
        `/quiz/${genResult.quizId}/attempt`,
        { method: 'POST' }
      );

      setAttemptId(startResult.attemptId);
      setQuestions(startResult.questions);
      setCurrentQuestionIndex(0);
      setSelectedChoice(null);
      setEvaluations({});
      setTimerSeconds(0);
      setQuestionStartTime(Date.now());
      setView('attempt');
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz arena');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit answer for single question
  const handleSubmitAnswer = async () => {
    if (!selectedChoice) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setIsSubmittingAnswer(true);
    const timeTakenS = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    try {
      const result = await apiFetch<AnswerEvaluation>(
        `/quiz/attempts/${attemptId}/answer`,
        {
          method: 'POST',
          body: {
            questionId: currentQuestion.id,
            userAnswer: selectedChoice,
            timeTakenS,
          },
        }
      );

      setEvaluations(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...result,
          userAnswer: selectedChoice,
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Move to next question or complete quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedChoice(null);
      setQuestionStartTime(Date.now());
    } else {
      handleCompleteQuiz();
    }
  };

  // Finalize quiz attempt
  const handleCompleteQuiz = async () => {
    try {
      const result = await apiFetch<any>(`/quiz/attempts/${attemptId}/complete`, {
        method: 'POST',
      });

      // Load results detail
      const attemptData = await apiFetch<any>(`/quiz/attempts/${attemptId}/result`);
      setScoreResult({
        score: Math.round(attemptData.score || 0),
        correctCount: attemptData.correctCount,
        totalQuestions: attemptData.totalQuestions,
        timeTakenS: attemptData.timeTakenS,
        feedback: result.feedback || 'Attempt finalized successfully.',
        breakdown: result.breakdown || {
          topics: {},
          difficulties: {},
          weakTopics: result.weakTopics || [],
          strongTopics: [],
        },
        answers: attemptData.answers,
      });

      setView('result');
    } catch (err: any) {
      alert(err.message || 'Failed to finalize quiz attempt');
    }
  };

  // View past attempt result details
  const handleViewPastAttempt = async (pastAttemptId: string) => {
    setIsLoadingHistory(true);
    try {
      const attemptData = await apiFetch<any>(`/quiz/attempts/${pastAttemptId}/result`);
      
      // Generate some default breakdown mapping if missing
      setScoreResult({
        score: Math.round(attemptData.score || 0),
        correctCount: attemptData.correctCount,
        totalQuestions: attemptData.totalQuestions,
        timeTakenS: attemptData.timeTakenS,
        feedback: 'Revisiting previous attempt results.',
        breakdown: {
          topics: {},
          difficulties: {},
          weakTopics: [],
          strongTopics: [],
        },
        answers: attemptData.answers,
      });

      setView('result');
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve attempt result');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Abandon attempt
  const handleAbandonQuiz = async () => {
    if (!window.confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) return;
    try {
      await apiFetch(`/quiz/attempts/${attemptId}/abandon`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setView('setup');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex text-ink overflow-x-hidden">
        {/* Left fixed navigation sidebar */}
        <Sidebar />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col lg:pl-72 min-h-screen relative pb-12">
          {/* Header Row */}
          <header className="px-6 md:px-10 py-5 border-b border-gray-100/50 bg-white flex items-center justify-between sticky top-0 z-30">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-ink flex items-center gap-2">
                <Trophy className="w-6 h-6 text-brand" />
                <span>Quiz Arena</span>
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                AI-driven diagnostic exams & customized spaced mastery
              </p>
            </div>
            
            {view === 'setup' && (
              <button
                onClick={() => setView('history')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-gray-100 hover:bg-gray-50 text-gray-500 hover:text-ink transition-colors cursor-pointer"
                type="button"
              >
                <History className="w-3.5 h-3.5" />
                <span>Quiz History</span>
              </button>
            )}

            {view === 'history' && (
              <button
                onClick={() => setView('setup')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-gray-100 hover:bg-gray-50 text-gray-500 hover:text-ink transition-colors cursor-pointer"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>New Quiz</span>
              </button>
            )}

            {view === 'attempt' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-brand-light/30 px-3.5 py-1.5 rounded-full text-brand-dark text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-brand animate-pulse" />
                  <span>{formatTime(timerSeconds)}</span>
                </div>
                <button
                  onClick={handleAbandonQuiz}
                  className="text-gray-400 hover:text-blush-dark hover:bg-blush-light/10 p-1.5 rounded-xl transition-colors cursor-pointer"
                  type="button"
                  title="Abandon quiz"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {view === 'result' && (
              <button
                onClick={() => setView('setup')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-brand hover:bg-brand-mid text-white transition-colors cursor-pointer"
                type="button"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Setup</span>
              </button>
            )}
          </header>

          <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-10 py-8 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {/* --- VIEW: SETUP --- */}
              {view === 'setup' && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* Adaptive Recommendations Banner */}
                  {weakAreas.length > 0 && (
                    <div className="bg-cream-light/35 border border-cream-mid/25 rounded-3xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-cream-mid/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-cream-dark" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-ink sentence-case">AI Mastery Advisory</h4>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1">
                          You have {weakAreas.length} weak topics (mastery &lt; 60%) including <span className="font-bold">{weakAreas.slice(0, 3).map(w => w.topicName).join(', ')}</span>. Turn on <strong>Adaptive Mode</strong> to generate questions specifically targeting these items.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleGenerateQuiz} className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
                    {/* Document Selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>1. Select Reference Documents *</span>
                      </label>
                      {documents.length === 0 ? (
                        <div className="p-6 border border-dashed border-gray-200 rounded-3xl text-center text-sm text-gray-500">
                          No processed documents available. Go to{' '}
                          <Link href="/documents" className="text-brand font-bold hover:underline">
                            Documents
                          </Link>{'} '}
                          to upload lecture notes or materials.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {documents.map((doc) => {
                            const isSelected = selectedDocIds.includes(doc.id);
                            return (
                              <div
                                key={doc.id}
                                onClick={() =>
                                  setSelectedDocIds(prev =>
                                    isSelected
                                      ? prev.filter(id => id !== doc.id)
                                      : [...prev, doc.id]
                                  )
                                }
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-brand/5 border-brand text-ink'
                                    : 'border-gray-100 hover:bg-gray-50 text-gray-600'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-brand border-brand text-white' : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <span className="text-xs font-bold truncate flex-1 leading-tight">{doc.filename}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Adaptive Mode toggle */}
                    <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-ink sentence-case">Adaptive Reinforcement</h4>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            Target questions toward known weak scoring topics
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAdaptive(!isAdaptive)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer relative ${
                          isAdaptive ? 'bg-brand' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                            isAdaptive ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Custom settings accordion */}
                    <div className="border-t border-gray-100 pt-6 space-y-6">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500 uppercase tracking-wide">
                        <Settings className="w-3.5 h-3.5 text-gray-400" />
                        <span>2. Configure Exam Parameters</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Questions Count */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-gray-600">Question Count</span>
                            <span className="text-xs font-extrabold text-brand">{questionCount} MCQs</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="30"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand"
                          />
                        </div>

                        {/* Presets */}
                        <div className="space-y-2">
                          <span className="text-xs font-extrabold text-gray-600 block">Difficulty Mix Presets</span>
                          <div className="flex gap-2">
                            {(['balanced', 'beginner', 'advanced'] as const).map((pr) => (
                              <button
                                key={pr}
                                type="button"
                                onClick={() => applyPreset(pr)}
                                className="flex-1 py-2 border border-gray-100 hover:bg-gray-50 text-[10px] font-bold rounded-xl text-gray-500 hover:text-ink capitalize transition-all cursor-pointer"
                              >
                                {pr}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Difficulty slider details */}
                      <div className="bg-surface rounded-2xl p-4 border border-gray-100/50 space-y-3">
                        <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide block">
                          Current Mix percentages (must equal 100%)
                        </span>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">Easy</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={difficultyMix.easy}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setDifficultyMix(prev => ({ ...prev, easy: val, medium: 100 - val - prev.hard }));
                              }}
                              className="w-16 bg-white border border-gray-100 rounded-lg py-1.5 text-center text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">Medium</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={difficultyMix.medium}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setDifficultyMix(prev => ({ ...prev, medium: val, hard: 100 - prev.easy - val }));
                              }}
                              className="w-16 bg-white border border-gray-100 rounded-lg py-1.5 text-center text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block">Hard</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={difficultyMix.hard}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setDifficultyMix(prev => ({ ...prev, hard: val, medium: 100 - prev.easy - val }));
                              }}
                              className="w-16 bg-white border border-gray-100 rounded-lg py-1.5 text-center text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Topic Focus */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-gray-600 block">Topic Focus (Optional)</label>
                        <input
                          type="text"
                          value={topicFocus}
                          onChange={(e) => setTopicFocus(e.target.value)}
                          placeholder="e.g. quantum superposition, organic nomenclature"
                          className="w-full bg-surface border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold text-ink placeholder-gray-400 focus:outline-none focus:border-brand transition-colors"
                        />
                      </div>
                    </div>

                    {/* Launch button */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isGenerating || selectedDocIds.length === 0}
                        className="w-full md:w-auto px-8 py-3.5 bg-brand hover:bg-brand-mid disabled:opacity-50 text-white font-extrabold text-xs tracking-wide uppercase rounded-2xl shadow-lg shadow-brand/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Synthesizing Exam Questions...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            <span>Enter Arena</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* --- VIEW: ATTEMPT --- */}
              {view === 'attempt' && (
                <motion.div
                  key="attempt"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between text-xs font-extrabold text-gray-400 select-none">
                    <span className="sentence-case">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span className="bg-brand-light/20 text-brand rounded-full px-2.5 py-0.5 capitalize text-[10px]">
                      {questions[currentQuestionIndex]?.difficulty}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand transition-all duration-500 rounded-full"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  {/* Main Question Card */}
                  {questions[currentQuestionIndex] && (
                    <div className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-6 h-6 text-brand shrink-0 mt-0.5" />
                        <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-ink leading-snug">
                          {questions[currentQuestionIndex].question}
                        </h2>
                      </div>

                      {/* Topic Pill */}
                      <span className="inline-block bg-brand-light text-brand-dark rounded-full px-3 py-1 text-[10px] font-bold tracking-tight">
                        {questions[currentQuestionIndex].topic}
                      </span>

                      {/* Choices Grid */}
                      <div className="grid grid-cols-1 gap-2.5 pt-4">
                        {(['A', 'B', 'C', 'D'] as const).map((choice) => {
                          const optionText = questions[currentQuestionIndex].options[choice];
                          const evaluation = evaluations[questions[currentQuestionIndex].id];
                          const isSelected = selectedChoice === choice;

                          // Styling conditions for checked choices
                          let choiceStyle = 'border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-600';
                          if (isSelected) {
                            choiceStyle = 'bg-brand/5 border-brand text-brand';
                          }

                          if (evaluation) {
                            const isCorrect = choice === evaluation.correctAnswer;
                            const isUserAns = choice === evaluation.userAnswer;
                            if (isCorrect) {
                              choiceStyle = 'bg-mint-light/35 border-mint text-mint-dark font-bold';
                            } else if (isUserAns && !isCorrect) {
                              choiceStyle = 'bg-blush-light/35 border-blush text-blush-dark';
                            } else {
                              choiceStyle = 'border-gray-100 opacity-60 text-gray-400 pointer-events-none';
                            }
                          }

                          return (
                            <button
                              key={choice}
                              type="button"
                              disabled={!!evaluation || isSubmittingAnswer}
                              onClick={() => setSelectedChoice(choice)}
                              className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${choiceStyle}`}
                            >
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-bold transition-all ${
                                isSelected ? 'bg-brand border-brand text-white' : 'border-gray-200 bg-white text-gray-500'
                              }`}>
                                {choice}
                              </span>
                              <span className="flex-1 mt-0.5 leading-snug">{optionText}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Instant evaluation panel */}
                      {evaluations[questions[currentQuestionIndex].id] && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-surface border border-gray-100 rounded-2xl p-5 space-y-3"
                        >
                          <div className="flex items-center gap-2 select-none">
                            {evaluations[questions[currentQuestionIndex].id].isCorrect ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-mint-mid" />
                                <span className="text-xs font-extrabold text-mint-dark">Correct Answer</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-5 h-5 text-blush-mid" />
                                <span className="text-xs font-extrabold text-blush-dark">Incorrect Answer</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 leading-relaxed font-semibold">
                            <span className="font-extrabold block text-gray-700 mb-1">AI Explanation:</span>
                            {evaluations[questions[currentQuestionIndex].id].explanation}
                          </div>
                        </motion.div>
                      )}

                      {/* Controls Footer */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentQuestionIndex > 0) {
                              setCurrentQuestionIndex(prev => prev - 1);
                              setSelectedChoice(evaluations[questions[currentQuestionIndex - 1]?.id]?.userAnswer || null);
                            }
                          }}
                          disabled={currentQuestionIndex === 0}
                          className="px-5 py-3 border border-gray-100 rounded-2xl text-xs font-bold text-gray-400 hover:text-ink disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          Previous
                        </button>

                        {!evaluations[questions[currentQuestionIndex].id] ? (
                          <button
                            type="button"
                            onClick={handleSubmitAnswer}
                            disabled={!selectedChoice || isSubmittingAnswer}
                            className="px-6 py-3 bg-brand hover:bg-brand-mid text-white rounded-2xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-brand/10"
                          >
                            {isSubmittingAnswer ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <span>Submit Answer</span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-brand hover:bg-brand-mid text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>
                              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* --- VIEW: RESULT --- */}
              {view === 'result' && scoreResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* Score circle & breakdown summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Circle Score Card */}
                    <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-4">
                        Overall Score
                      </span>
                      <div className="w-32 h-32 rounded-full border-8 border-brand-light flex items-center justify-center relative">
                        <span className="text-3xl font-black text-ink">{scoreResult.score}%</span>
                        <div
                          className="absolute inset-0 rounded-full border-8 border-brand border-t-transparent border-l-transparent transition-transform"
                          style={{ transform: `rotate(${(scoreResult.score / 100) * 360}deg)` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-bold mt-4">
                        {scoreResult.correctCount} / {scoreResult.totalQuestions} Correct MCQs
                      </span>
                    </div>

                    {/* Stats details */}
                    <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center space-y-4 md:col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface rounded-2xl p-4 border border-gray-100/50">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                            Time Taken
                          </span>
                          <span className="text-xl font-extrabold text-ink block mt-1">
                            {formatTime(scoreResult.timeTakenS)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {(scoreResult.timeTakenS / scoreResult.totalQuestions).toFixed(1)}s avg per question
                          </span>
                        </div>

                        <div className="bg-surface rounded-2xl p-4 border border-gray-100/50">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                            Weak Areas Flagged
                          </span>
                          <span className="text-xl font-extrabold text-blush-dark block mt-1">
                            {scoreResult.breakdown.weakTopics.length} topics
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            Mastery scores fell below 60%
                          </span>
                        </div>
                      </div>

                      {/* Weak areas badges */}
                      {scoreResult.breakdown.weakTopics.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                            Recommended Focus:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {scoreResult.breakdown.weakTopics.map((topic, i) => (
                              <span key={i} className="bg-blush-light text-blush-dark rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Tutor feedback report */}
                  <div className="bg-brand/5 border border-brand/10 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand" />
                      <h3 className="text-base font-extrabold text-ink">AI Copilot Diagnostic Assessment</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-600 font-semibold leading-relaxed leading-relaxed whitespace-pre-wrap">
                      {scoreResult.feedback}
                    </div>
                  </div>

                  {/* Complete question review list */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider px-2">
                      Questions Review
                    </h3>
                    <div className="space-y-4">
                      {scoreResult.answers.map((ans, idx) => (
                        <div
                          key={ans.questionId}
                          className={`bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 ${
                            ans.isCorrect ? 'border-l-4 border-l-mint' : 'border-l-4 border-l-blush'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                              {idx + 1}
                            </span>
                            <p className="flex-1 text-sm font-extrabold text-ink mt-0.5 leading-snug">{ans.question}</p>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              ans.isCorrect ? 'bg-mint-light text-mint-dark' : 'bg-blush-light text-blush-dark'
                            }`}>
                              {ans.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold pl-9">
                            {(['A', 'B', 'C', 'D'] as const).map((choice) => {
                              const isCorrectOption = choice === ans.correctAnswer;
                              const isUserOption = choice === ans.userAnswer;
                              let style = 'text-gray-500 border border-gray-100/50';

                              if (isCorrectOption) {
                                style = 'bg-mint-light/20 border-mint text-mint-dark font-bold';
                              } else if (isUserOption) {
                                style = 'bg-blush-light/20 border-blush text-blush-dark';
                              }

                              return (
                                <div key={choice} className={`p-3 rounded-xl flex items-center gap-2.5 ${style}`}>
                                  <span className="w-5 h-5 rounded-md border bg-white border-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {choice}
                                  </span>
                                  <span className="truncate leading-tight">{ans.options[choice]}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          <div className="bg-surface rounded-2xl p-4 text-xs text-gray-600 font-semibold leading-relaxed border border-gray-100/50 pl-9">
                            <BookOpen className="w-4 h-4 text-brand inline-block shrink-0 mt-0.5 mr-2" />
                            <span className="font-extrabold text-gray-700 block mt-1 mb-1">Explanation:</span>
                            {ans.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* --- VIEW: HISTORY --- */}
              {view === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin text-brand" />
                      <p className="text-sm font-semibold">Retrieving history logs...</p>
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-[32px] p-10 text-center space-y-4">
                      <Trophy className="w-12 h-12 text-gray-300 mx-auto" />
                      <h3 className="text-base font-extrabold text-ink">No Attempts Logged Yet</h3>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">
                        Complete your first AI generated diagnostic quiz to begin tracking your mastery progression scores here.
                      </p>
                      <button
                        onClick={() => setView('setup')}
                        className="px-5 py-2.5 bg-brand hover:bg-brand-mid text-white font-extrabold text-xs rounded-2xl transition-colors cursor-pointer"
                        type="button"
                      >
                        Enter Setup
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {historyList.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleViewPastAttempt(item.id)}
                          className="bg-white border border-gray-100 hover:border-gray-200 rounded-3xl p-5 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-6"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-extrabold text-ink truncate sentence-case">
                              {item.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[10px] font-semibold text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(item.timeTakenS)}</span>
                              </span>
                              <span>{item.correctCount} / {item.totalQuestions} Correct</span>
                              <span>Completed {item.completedAt}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Score badge */}
                            <span className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xs ${
                              item.score >= 80
                                ? 'bg-mint-light text-mint-dark'
                                : item.score >= 50
                                ? 'bg-cream-light text-cream-dark'
                                : 'bg-blush-light text-blush-dark'
                            }`}>
                              {item.score}%
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Sticky bottom application navigation bar for mobile sizes */}
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
