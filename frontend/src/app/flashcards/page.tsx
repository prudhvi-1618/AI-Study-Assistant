'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, X, RefreshCw, Loader2, Sparkles, Check, FileText } from 'lucide-react';

// Sidebar & Global Nav Components
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/AuthProvider';

// Flashcard Specific Components
import { DeckSidebar } from '@/components/flashcards/DeckSidebar';
import { DeckList } from '@/components/flashcards/DeckList';
import { FlashcardHeader } from '@/components/flashcards/FlashcardHeader';
import { TopicTabs } from '@/components/flashcards/TopicTabs';
import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck';
import { Flashcard } from '@/components/flashcards/Flashcard';
import { StudyControls } from '@/components/flashcards/StudyControls';
import { DifficultyButtons } from '@/components/flashcards/DifficultyButtons';
import { ProgressStats } from '@/components/flashcards/ProgressStats';
import { FullscreenMode } from '@/components/flashcards/FullscreenMode';
import { SessionSummary } from '@/components/flashcards/SessionSummary';
import { EmptyState } from '@/components/flashcards/EmptyState';
import { FloatingMobileControls } from '@/components/flashcards/FloatingMobileControls';

// Data types and api client
import {
  Flashcard as FlashcardType,
  Deck as DeckType,
} from '@/lib/flashcards/data';
import { apiFetch } from '@/lib/api';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const name = user?.name || 'User';
  const email = user?.email || '';
  const initials = name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';

  const colors = [
    'bg-brand-light text-brand-dark',
    'bg-mint-light text-mint-dark',
    'bg-cream-light text-cream-dark',
    'bg-blush-light text-blush-dark',
  ];

  // Page states
  const [decks, setDecks] = useState<DeckType[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [deckCards, setDeckCards] = useState<FlashcardType[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState<boolean>(true);
  const [isLoadingCards, setIsLoadingCards] = useState<boolean>(false);
  const [activeTopic, setActiveTopic] = useState<string>('All');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Timer state
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Space repetition & study sessions state
  const [sessionRatings, setSessionRatings] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({});
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [weakCardsFilterActive, setWeakCardsFilterActive] = useState<boolean>(false);
  const [weakCardIds, setWeakCardIds] = useState<string[]>([]);

  // Document Selection & Generation Modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [cardCount, setCardCount] = useState<number>(20);
  const [generationDifficulty, setGenerationDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [topicFocus, setTopicFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // AI Explanation drawer state
  const [explanationCardId, setExplanationCardId] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);

  // Find active deck
  const activeDeck = useMemo(() => {
    return decks.find(d => d.id === activeDeckId) || decks[0];
  }, [decks, activeDeckId]);

  // Load raw cards for active deck
  const rawCards = deckCards;

  // Get unique topics for active deck
  const topicsList = useMemo(() => {
    const topics = new Set<string>();
    rawCards.forEach(c => topics.add(c.topic));
    return ['All', ...Array.from(topics)];
  }, [rawCards]);

  // Filtered cards based on topic
  const filteredCards = useMemo(() => {
    if (activeTopic === 'All') return rawCards;
    return rawCards.filter(c => c.topic === activeTopic);
  }, [rawCards, activeTopic]);

  // Shuffled cards tracking
  const [shuffledCards, setShuffledCards] = useState<FlashcardType[]>([]);

  // Track the actual active card list
  const activeCards = useMemo(() => {
    const baseList = isShuffled ? shuffledCards : filteredCards;
    if (weakCardsFilterActive) {
      return baseList.filter(c => weakCardIds.includes(c.id));
    }
    return baseList;
  }, [isShuffled, shuffledCards, filteredCards, weakCardsFilterActive, weakCardIds]);

  // Update shuffled list when filtered cards change or shuffle is toggled
  useEffect(() => {
    if (isShuffled) {
      const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
      setShuffledCards(shuffled);
    } else {
      setShuffledCards(filteredCards);
    }
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [filteredCards, isShuffled]);

  // Study timer runner
  useEffect(() => {
    if (sessionCompleted || activeCards.length === 0) return;

    const interval = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionCompleted, activeCards.length]);

  // Fetch all decks from backend
  const fetchDecks = async (selectFirst = false, selectId?: string) => {
    setIsLoadingDecks(true);
    try {
      const data = await apiFetch<{ decks: any[] }>('/flashcards/decks');
      const mapped = (data.decks || []).map((d: any, index: number) => ({
        id: d.id,
        title: d.title,
        cards: d.card_count,
        mastered: 0,
        color: colors[index % colors.length],
      }));
      setDecks(mapped);

      if (mapped.length > 0) {
        if (selectId) {
          handleSelectDeck(selectId);
        } else if (selectFirst || !activeDeckId) {
          handleSelectDeck(mapped[0].id);
        }
      } else {
        setActiveDeckId('');
        setDeckCards([]);
      }
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    } finally {
      setIsLoadingDecks(false);
    }
  };

  // Load decks on mount
  useEffect(() => {
    fetchDecks(true);
  }, []);

  // Fetch user documents for generation modal
  useEffect(() => {
    if (isGenerateModalOpen) {
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
    }
  }, [isGenerateModalOpen]);

  // Reset session and states on deck switch and load cards
  const handleSelectDeck = async (deckId: string) => {
    setActiveDeckId(deckId);
    setActiveTopic('All');
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setSessionRatings({});
    setSessionCompleted(false);
    setWeakCardsFilterActive(false);
    setWeakCardIds([]);
    setTimeSpentSeconds(0);

    setIsLoadingCards(true);
    try {
      const deckData = await apiFetch<any>(`/flashcards/decks/${deckId}`);
      if (deckData && deckData.flashcards) {
        const mappedCards = deckData.flashcards.map((c: any) => ({
          id: c.id,
          topic: c.topic || 'General',
          difficulty: c.difficulty || 'medium',
          question: c.front,
          answer: c.back,
          hint: '',
          example: '',
          source: '',
          importance: c.mastery_level === 'mastered' ? 'High' : 'Medium',
        }));
        setDeckCards(mappedCards);

        // Compute initial mastered count
        const masteredCount = deckData.flashcards.filter((c: any) => c.mastery_level === 'mastered').length;
        setDecks(prev => prev.map(d => d.id === deckId ? { ...d, mastered: masteredCount } : d));
      }
    } catch (err) {
      console.error('Failed to fetch deck cards:', err);
    } finally {
      setIsLoadingCards(false);
    }
  };

  // Switch back to demo/first deck
  const handleGenerateDemo = () => {
    if (decks.length > 0) {
      handleSelectDeck(decks[0].id);
    } else {
      setIsGenerateModalOpen(true);
    }
  };

  // Trigger deck generation
  const handleGenerateDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDocIds.length === 0) return;

    setIsGenerating(true);
    try {
      const result = await apiFetch<{ deckId: string; cardCount: number; deckTitle: string }>(
        '/flashcards/generate',
        {
          method: 'POST',
          body: {
            documentIds: selectedDocIds,
            count: cardCount,
            difficulty: generationDifficulty,
            topicFocus: topicFocus || null,
          },
        }
      );
      setIsGenerateModalOpen(false);
      // Reset inputs
      setSelectedDocIds([]);
      setTopicFocus('');
      // Reload decks and automatically select the new deck
      await fetchDecks(false, result.deckId);
    } catch (err: any) {
      alert(err.message || 'Failed to generate flashcard deck');
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigations
  const handleNext = () => {
    if (activeCards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev + 1) % activeCards.length);
  };

  const handlePrev = () => {
    if (activeCards.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev - 1 + activeCards.length) % activeCards.length);
  };

  // Shuffle toggle
  const handleShuffleToggle = () => {
    setIsShuffled(prev => !prev);
  };

  // Rate a card
  const handleRateCard = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = activeCards[currentCardIndex];
    if (!currentCard) return;

    // Record the rating
    setSessionRatings(prev => ({
      ...prev,
      [currentCard.id]: difficulty,
    }));

    // Post review status to the backend in background
    try {
      const result = difficulty === 'hard' ? 'incorrect' : 'correct';
      await apiFetch(`/flashcards/cards/${currentCard.id}/review`, {
        method: 'POST',
        body: { result },
      });
    } catch (err) {
      console.error('Failed to submit review:', err);
    }

    // Update deck mastered count in sidebars
    setDecks(prevDecks => {
      return prevDecks.map(d => {
        if (d.id === activeDeckId) {
          const isMastered = difficulty === 'easy' || difficulty === 'medium';
          const wasMasteredBefore = sessionRatings[currentCard.id] === 'easy' || sessionRatings[currentCard.id] === 'medium';

          let newMastered = d.mastered;
          if (isMastered && !wasMasteredBefore) {
            newMastered = Math.min(d.cards, d.mastered + 1);
          } else if (!isMastered && wasMasteredBefore) {
            newMastered = Math.max(0, d.mastered - 1);
          }

          return {
            ...d,
            mastered: newMastered,
          };
        }
        return d;
      });
    });

    // Advance index or complete session
    if (currentCardIndex < activeCards.length - 1) {
      setTimeout(() => {
        setIsFlipped(false);
        setCurrentCardIndex(prev => prev + 1);
      }, 350);
    } else {
      setTimeout(() => {
        setSessionCompleted(true);
      }, 350);
    }
  };

  const handleExplainCard = async (cardId: string) => {
    setExplanationCardId(cardId);
    setIsLoadingExplanation(true);
    setExplanationText('');
    try {
      const data = await apiFetch<{ explanation: string }>(`/flashcards/cards/${cardId}/explain`);
      setExplanationText(data.explanation);
    } catch (err) {
      console.error('Failed to fetch AI explanation:', err);
      setExplanationText('Failed to generate AI explanation. Please try again.');
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  // Review weak cards action
  const handleReviewWeakCards = () => {
    const weakIds = Object.keys(sessionRatings).filter(
      id => sessionRatings[id] === 'hard' || sessionRatings[id] === 'medium'
    );

    if (weakIds.length === 0) return;

    setWeakCardIds(weakIds);
    setWeakCardsFilterActive(true);
    
    // Clear ratings for weak cards to restart review
    const updatedRatings = { ...sessionRatings };
    weakIds.forEach(id => {
      delete updatedRatings[id];
    });
    setSessionRatings(updatedRatings);
    
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  // Restart standard session
  const handleRestartSession = () => {
    setSessionRatings({});
    setSessionCompleted(false);
    setWeakCardsFilterActive(false);
    setWeakCardIds([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setTimeSpentSeconds(0);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if the user is typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (sessionCompleted || activeCards.length === 0) return;

      switch (e.key) {
        case ' ': // Space bar flips card
          e.preventDefault();
          setIsFlipped(prev => !prev);
          break;
        case 'ArrowRight': // Next card
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft': // Prev card
          e.preventDefault();
          handlePrev();
          break;
        case '1': // Rate Easy
          if (isFlipped) {
            e.preventDefault();
            handleRateCard('easy');
          }
          break;
        case '2': // Rate Medium
          if (isFlipped) {
            e.preventDefault();
            handleRateCard('medium');
          }
          break;
        case '3': // Rate Hard
          if (isFlipped) {
            e.preventDefault();
            handleRateCard('hard');
          }
          break;
        case 'f':
        case 'F': // Toggle fullscreen focus mode
          e.preventDefault();
          setIsFullscreen(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCards, currentCardIndex, isFlipped, sessionCompleted]);

  // Derived progress stats values
  const reviewedCount = useMemo(() => {
    return activeCards.filter(c => sessionRatings[c.id]).length;
  }, [activeCards, sessionRatings]);

  const accuracyRate = useMemo(() => {
    const rated = activeCards.filter(c => sessionRatings[c.id]);
    if (rated.length === 0) return 0;

    const easy = rated.filter(c => sessionRatings[c.id] === 'easy').length;
    const med = rated.filter(c => sessionRatings[c.id] === 'medium').length;
    return Math.round(((easy + med * 0.5) / rated.length) * 100);
  }, [activeCards, sessionRatings]);

  // Counts for session completed screen
  const easyCount = useMemo(() => activeCards.filter(c => sessionRatings[c.id] === 'easy').length, [activeCards, sessionRatings]);
  const mediumCount = useMemo(() => activeCards.filter(c => sessionRatings[c.id] === 'medium').length, [activeCards, sessionRatings]);
  const hardCount = useMemo(() => activeCards.filter(c => sessionRatings[c.id] === 'hard').length, [activeCards, sessionRatings]);

  // Render the core card viewing container
  const renderStudyArena = () => {
    if (activeCards.length === 0) {
      return <EmptyState onGenerateDemo={activeDeckId !== '1' ? handleGenerateDemo : undefined} />;
    }

    if (sessionCompleted) {
      return (
        <SessionSummary
          deckTitle={activeDeck.title}
          totalCards={activeCards.length}
          easyCount={easyCount}
          mediumCount={mediumCount}
          hardCount={hardCount}
          timeSpentSeconds={timeSpentSeconds}
          onRestart={handleRestartSession}
          onReviewWeakCards={hardCount + mediumCount > 0 ? handleReviewWeakCards : undefined}
        />
      );
    }

    const currentCard = activeCards[currentCardIndex];

    return (
      <div className="mx-auto">
        {/* Shuffle button (Ghost style) */}
      <button
        onClick={handleShuffleToggle}
        className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
          isShuffled
            ? 'bg-brand/10 text-brand hover:bg-brand/15'
            : 'text-gray-500 hover:text-ink hover:bg-gray-100'
        }`}
        type="button"
        title="Shuffle deck"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isShuffled ? 'animate-spin-slow' : ''}`} />
        <span className="sentence-case">Shuffle</span>
      </button>
        <div className="flex-1 flex flex-col justify-center w-[600px] px-4 py-4 relative">
          {/* Flashcard 3D Flipper and Drag Area */}
          <FlashcardDeck
            onPrev={handlePrev}
            onNext={handleNext}
            onFlip={() => setIsFlipped(!isFlipped)}
            isFlipped={isFlipped}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-center"
              >
                <Flashcard
                  card={currentCard}
                  index={currentCardIndex}
                  total={activeCards.length}
                  flipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                  onSwipeLeft={() => handleRateCard('hard')}
                  onSwipeRight={() => handleRateCard('easy')}
                  onExplain={handleExplainCard}
                />
              </motion.div>
            </AnimatePresence>
          </FlashcardDeck>

          {/* Study rate options (Desktop only below card, Mobile is in floating menu) */}
          <div className="hidden lg:block w-full text-center">
            <DifficultyButtons
              visible={isFlipped}
              onRate={handleRateCard}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface flex text-ink overflow-x-hidden">
      {/* 1. Desktop Deck Selector Sidebar (Left fixed) */}
      <DeckSidebar
        decks={decks}
        activeDeckId={activeDeckId}
        onSelectDeck={handleSelectDeck}
        onGenerateDeck={() => setIsGenerateModalOpen(true)}
      />

      {/* 2. Collapsible Mobile/Tablet Drawer for Decks */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-ink z-50 lg:hidden"
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-ink text-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-extrabold text-lg ml-2.5 tracking-tight">
                    StudyAI Decks
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 mt-4">
                <button
                  onClick={() => {
                    setIsGenerateModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-brand hover:bg-brand-mid active:scale-95 text-white rounded-2xl px-4 py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-all"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  <span className="sentence-case">Generate flashcards</span>
                </button>
              </div>

              <DeckList
                decks={decks}
                activeDeckId={activeDeckId}
                onSelectDeck={(id) => {
                  handleSelectDeck(id);
                  setMobileMenuOpen(false);
                }}
              />

              <div className="mt-auto border-t border-white/10 p-4 flex items-center gap-2.5 mx-3 mb-4 pt-4">
                <div className="w-8 h-8 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-extrabold text-xs shrink-0 select-none">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate block">
                    {name}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate block">
                    {email}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Center Study & Header Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-h-screen relative pb-6">
        {/* Sticky Header Banner */}
        {/* <FlashcardHeader
          deckTitle={activeDeck.title}
          cardsCount={activeCards.length}
          isShuffled={isShuffled}
          onShuffle={handleShuffleToggle}
          onToggleFullscreen={() => setIsFullscreen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        /> */}

        {/* Dynamic scrolling Filter Pills */}
        {activeCards.length > 0 && !sessionCompleted && (
          <TopicTabs
            topics={topicsList}
            activeTopic={activeTopic}
            onSelectTopic={(topic) => {
              setActiveTopic(topic);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
          />
        )}

        {/* Main interactive study center split with sidebar */}
        <div className="flex-1 flex flex-col xl:flex-row">
          <main className="flex-1 flex flex-col justify-center">
            {renderStudyArena()}
          </main>

          {/* Right Statistics Panel (Sticky on Desktop) */}
          {activeCards.length > 0 && !sessionCompleted && (
            <ProgressStats
              reviewedCount={reviewedCount}
              totalCount={activeCards.length}
              streakDays={4}
              accuracyRate={accuracyRate}
            />
          )}
        </div>
      </div>

      {/* 4. Fullscreen focus overlay */}
      {isFullscreen && (
        <FullscreenMode
          deckTitle={activeDeck.title}
          timeSpentSeconds={timeSpentSeconds}
          onClose={() => setIsFullscreen(false)}
        >
          {activeCards.length > 0 ? (
            <div className="flex flex-col items-center gap-6 w-full">
              <Flashcard
                card={activeCards[currentCardIndex]}
                index={currentCardIndex}
                total={activeCards.length}
                flipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
                onExplain={handleExplainCard}
              />
              <DifficultyButtons
                visible={isFlipped}
                onRate={handleRateCard}
              />
              <StudyControls
                onPrev={handlePrev}
                onNext={handleNext}
                onFlip={() => setIsFlipped(!isFlipped)}
                isFlipped={isFlipped}
                onShuffle={handleShuffleToggle}
                isShuffled={isShuffled}
              />
            </div>
          ) : (
            <EmptyState onGenerateDemo={handleGenerateDemo} />
          )}
        </FullscreenMode>
      )}

      {/* 5. Mobile Floating Controls capsule (hidden on desktop) */}
      {!isFullscreen && activeCards.length > 0 && !sessionCompleted && (
        <FloatingMobileControls
          onPrev={handlePrev}
          onNext={handleNext}
          onFlip={() => setIsFlipped(!isFlipped)}
          isFlipped={isFlipped}
          onRate={handleRateCard}
          showDifficulty={isFlipped}
        />
      )}

      {/* 6. Sticky bottom application navigation bar for mobile sizes */}
      {!isFullscreen && <BottomNav />}

      {/* AI Explanation Drawer */}
      <AnimatePresence>
        {explanationCardId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setExplanationCardId(null)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-gray-100 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand" />
                  <h3 className="font-extrabold text-lg text-ink">AI Deep Explanation</h3>
                </div>
                <button
                  onClick={() => setExplanationCardId(null)}
                  className="text-gray-400 hover:text-ink p-1.5 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingExplanation ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                    <p className="text-sm font-semibold">Consulting AI study copilot...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-4 whitespace-pre-wrap">
                    {explanationText}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Generate Flashcards Modal */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isGenerating) setIsGenerateModalOpen(false);
              }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-10 md:top-20 md:mx-auto max-w-xl bg-white border border-gray-100 rounded-[32px] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-brand" />
                  <h3 className="font-extrabold text-lg text-ink">Generate Study Flashcards</h3>
                </div>
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  disabled={isGenerating}
                  className="text-gray-400 hover:text-ink p-1.5 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateDeckSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Document Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide block">
                    Select Study Documents *
                  </label>
                  {documents.length === 0 ? (
                    <div className="p-4 border border-dashed border-gray-200 rounded-2xl text-center text-sm text-gray-500">
                      No ready documents found. Go to <Link href="/documents" className="text-brand font-bold hover:underline">Documents</Link> to upload.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {documents.map((doc) => {
                        const isSelected = selectedDocIds.includes(doc.id);
                        return (
                          <div
                            key={doc.id}
                            onClick={() => {
                              if (isGenerating) return;
                              setSelectedDocIds(prev =>
                                isSelected
                                  ? prev.filter(id => id !== doc.id)
                                  : [...prev, doc.id]
                              );
                            }}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
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
                            <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand' : 'text-gray-400'}`} />
                            <span className="text-xs font-bold truncate flex-1 leading-tight">{doc.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Count Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
                      Number of Flashcards
                    </label>
                    <span className="text-xs font-bold text-brand">{cardCount} cards</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={cardCount}
                    onChange={(e) => setCardCount(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>

                {/* Difficulty Select */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide block">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['mixed', 'easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setGenerationDifficulty(diff)}
                        disabled={isGenerating}
                        className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer capitalize ${
                          generationDifficulty === diff
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'border-gray-100 hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Focus */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide block">
                    Topic Focus (Optional)
                  </label>
                  <input
                    type="text"
                    value={topicFocus}
                    onChange={(e) => setTopicFocus(e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g. electromagnetic waves, covalent bonding"
                    className="w-full bg-surface border border-gray-100 rounded-2xl px-4 py-3 text-sm text-ink placeholder-gray-400 focus:outline-none focus:border-brand transition-colors"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    disabled={isGenerating}
                    className="px-5 py-3 rounded-2xl text-xs font-bold border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || selectedDocIds.length === 0}
                    className="px-6 py-3 rounded-2xl text-xs font-bold bg-brand hover:bg-brand-mid text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Deck</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  </ProtectedRoute>
  );
}
