'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, X, RefreshCw } from 'lucide-react';

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

// Mock Data & Service
import {
  mockDecks,
  getFlashcardsForDeck,
  Flashcard as FlashcardType,
  Deck as DeckType,
} from '@/lib/flashcards/data';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const name = user?.name || 'User';
  const email = user?.email || '';
  const initials = name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';

  // Page states
  const [decks, setDecks] = useState<DeckType[]>(mockDecks);
  const [activeDeckId, setActiveDeckId] = useState<string>('1');
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

  // Find active deck
  const activeDeck = useMemo(() => {
    return decks.find(d => d.id === activeDeckId) || decks[0];
  }, [decks, activeDeckId]);

  // Load raw cards for active deck
  const rawCards = useMemo(() => {
    return getFlashcardsForDeck(activeDeckId);
  }, [activeDeckId]);

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
    if (sessionCompleted) return;

    const interval = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionCompleted]);

  // Reset session and states on deck switch
  const handleSelectDeck = (deckId: string) => {
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
  };

  // Switch back to demo (used in EmptyState)
  const handleGenerateDemo = () => {
    handleSelectDeck('1');
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
  const handleRateCard = (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = activeCards[currentCardIndex];
    if (!currentCard) return;

    // Record the rating
    setSessionRatings(prev => ({
      ...prev,
      [currentCard.id]: difficulty,
    }));

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
            {/* <StudyControls
              onPrev={handlePrev}
              onNext={handleNext}
              onFlip={() => setIsFlipped(!isFlipped)}
              isFlipped={isFlipped}
              onShuffle={handleShuffleToggle}
              isShuffled={isShuffled}
            /> */}
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
        onGenerateDeck={() => handleSelectDeck('1')}
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
                    handleSelectDeck('1');
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
    </div>
  </ProtectedRoute>
  );
}
