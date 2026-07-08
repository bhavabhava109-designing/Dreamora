import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCw, Check, X, ChevronLeft, ChevronRight, BookOpen, Award } from 'lucide-react';

const DEFAULT_FLASHCARDS = [
  {
    id: 'default-1',
    front: 'What is the Pomodoro Technique?',
    back: 'A time management method using a timer to break work into 25-minute intervals, separated by short breaks.'
  },
  {
    id: 'default-2',
    front: 'What is active recall?',
    back: 'A study method where you actively test your memory, stimulating brain connections to strengthen learning retrieval.'
  },
  {
    id: 'default-3',
    front: 'What is the Feynman Technique?',
    back: 'A mental model where you explain a concept in simple terms, as if teaching a child, to identify gaps in your understanding.'
  }
];

export default function Flashcards() {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('dreamora_flashcards');
    return saved ? JSON.parse(saved) : DEFAULT_FLASHCARDS;
  });

  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Study state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('dreamora_flashcards_score');
    return saved ? JSON.parse(saved) : { correct: 0, incorrect: 0, studied: [] };
  });

  useEffect(() => {
    localStorage.setItem('dreamora_flashcards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('dreamora_flashcards_score', JSON.stringify(score));
  }, [score]);

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!frontText.trim() || !backText.trim()) return;

    const newCard = {
      id: Date.now().toString(),
      front: frontText.trim(),
      back: backText.trim()
    };

    setCards([...cards, newCard]);
    setFrontText('');
    setBackText('');
    setIsAdding(false);
  };

  const handleDeleteCard = (id, e) => {
    e.stopPropagation();
    const updatedCards = cards.filter(card => card.id !== id);
    setCards(updatedCards);
    
    // Adjust index if necessary
    if (currentIndex >= updatedCards.length && updatedCards.length > 0) {
      setCurrentIndex(updatedCards.length - 1);
    } else if (updatedCards.length === 0) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleAnswer = (correct) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];
    
    setScore(prev => {
      const alreadyStudied = prev.studied.includes(currentCard.id);
      const nextStudied = alreadyStudied ? prev.studied : [...prev.studied, currentCard.id];
      
      return {
        correct: correct ? prev.correct + 1 : prev.correct,
        incorrect: !correct ? prev.incorrect + 1 : prev.incorrect,
        studied: nextStudied
      };
    });

    handleNext();
  };

  const handleResetScore = () => {
    setScore({ correct: 0, incorrect: 0, studied: [] });
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-96 relative overflow-hidden animate-fade-in mt-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <BookOpen size={13} className="text-[var(--primary)]" />
            Study Flashcards
          </h3>
          <p className="text-[10px] text-gray-500">Practice active recall with decks</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="glass-button text-[9px] py-1 px-2 font-bold uppercase tracking-wider bg-transparent text-[var(--primary)] hover:bg-[var(--primary-glow)] transition-all border border-[var(--border)] rounded-lg flex items-center gap-1"
        >
          <Plus size={10} /> {isAdding ? 'Study View' : 'Add Card'}
        </button>
      </div>

      {isAdding ? (
        /* Card Creator Form */
        <form onSubmit={handleAddCard} className="flex-1 flex flex-col justify-between my-2">
          <div className="space-y-2">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Front (Question/Term)</label>
              <input
                type="text"
                placeholder="e.g. Mitochondria"
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--primary)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Back (Answer/Definition)</label>
              <textarea
                placeholder="e.g. The powerhouse of the cell, generating chemical energy."
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                className="w-full bg-black/40 border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--primary)] transition-colors h-16 resize-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full glass-button text-[10px] py-2 font-bold uppercase tracking-wider bg-[var(--primary)] text-[var(--bg-dark)] hover:opacity-90 transition-all border border-[var(--primary)] rounded-lg flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Add Card to Deck
          </button>
        </form>
      ) : cards.length === 0 ? (
        /* Empty Deck View */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs text-gray-500 mb-3">Your flashcard deck is currently empty.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="glass-button text-[10px] py-1.5 px-3 font-bold uppercase tracking-wider bg-[var(--primary)] text-[var(--bg-dark)] hover:opacity-90 transition-all border border-[var(--primary)] rounded-lg"
          >
            Create First Card
          </button>
        </div>
      ) : (
        /* Card Study View */
        <div className="flex-1 flex flex-col justify-between my-1">
          {/* Card perspective wrapper */}
          <div 
            onClick={handleFlip}
            className="flashcard-perspective relative w-full h-36 cursor-pointer group"
          >
            <div className={`flashcard-inner w-full h-full relative ${isFlipped ? 'flashcard-flipped' : ''}`}>
              {/* Front side */}
              <div className="flashcard-front bg-black/20 border border-[var(--border)] absolute inset-0 flex flex-col items-center justify-center text-center p-4 rounded-xl shadow-lg">
                <span className="absolute top-2.5 right-3 text-[8px] uppercase tracking-wider text-gray-500 font-bold">Front</span>
                <p className="text-xs text-gray-200 font-semibold max-w-[90%] break-words">{currentCard.front}</p>
                <div className="absolute bottom-2 text-gray-500 group-hover:text-[var(--primary)] transition-colors flex items-center gap-1 text-[8px] uppercase font-bold tracking-wider">
                  <RotateCw size={10} /> Tap to Flip
                </div>
              </div>

              {/* Back side */}
              <div className="flashcard-back bg-black/40 border border-[var(--primary-glow)] absolute inset-0 flex flex-col items-center justify-center text-center p-4 rounded-xl shadow-lg">
                <span className="absolute top-2.5 right-3 text-[8px] uppercase tracking-wider text-[var(--primary)] font-bold">Back</span>
                <p className="text-xs text-gray-300 font-medium max-w-[90%] break-words leading-relaxed">{currentCard.back}</p>
                <div className="absolute bottom-2 text-gray-500 group-hover:text-[var(--primary)] transition-colors flex items-center gap-1 text-[8px] uppercase font-bold tracking-wider">
                  <RotateCw size={10} /> Tap to Flip
                </div>
              </div>
            </div>
            
            {/* Delete button on top corner of the card stack */}
            <button
              onClick={(e) => handleDeleteCard(currentCard.id, e)}
              className="absolute -top-1 -right-1 bg-black/80 hover:bg-red-950/80 border border-[var(--border)] text-gray-500 hover:text-red-400 p-1.5 rounded-full transition-colors z-20"
              title="Delete this card"
            >
              <Trash2 size={10} />
            </button>
          </div>

          {/* Navigation and Feedback Controls */}
          <div className="flex flex-col gap-2 mt-3.5">
            {/* Quick Answer Buttons when card is flipped */}
            {isFlipped ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 glass-button text-[9px] py-1.5 font-bold uppercase tracking-wider bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-900/50 rounded-lg flex items-center justify-center gap-1"
                >
                  <X size={10} /> Needs Review
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 glass-button text-[9px] py-1.5 font-bold uppercase tracking-wider bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/50 rounded-lg flex items-center justify-center gap-1"
                >
                  <Check size={10} /> Got It!
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center px-1">
                <button
                  onClick={handlePrev}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Previous card"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] text-gray-500 font-bold">
                  Card {currentIndex + 1} of {cards.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Next card"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Score Keeper Footer */}
            <div className="flex justify-between items-center mt-1 pt-2 border-t border-[var(--border)] text-[9px]">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Award size={10} className="text-amber-500" />
                <span>Studied: <span className="font-semibold text-[var(--primary)]">{score.studied.length}</span></span>
                <span className="text-gray-600">|</span>
                <span className="text-emerald-500 font-semibold">{score.correct} ✔</span>
                <span className="text-gray-600">|</span>
                <span className="text-red-500 font-semibold">{score.incorrect} ✘</span>
              </div>
              <button 
                onClick={handleResetScore} 
                className="text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider font-bold"
              >
                Reset Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
