import { useState, useEffect, useCallback, useRef } from 'react';
import { BlurredImage } from './BlurredImage';
import { TiltedCover } from './TiltedCover';
import { GuessInput } from './GuessInput';
import { HintDisplay } from './HintDisplay';
import { GameOver } from './GameOver';
import { selectRandomAlbum, checkGuess, generateHints, calculateBlurLevel, findMatchingAlbum, hasMatchingArtist } from '../utils/gameLogic';

function shuffleTiles() {
  const arr = [0, 1, 2, 3, 4, 5];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newGame(albums) {
  return {
    currentAlbum: selectRandomAlbum(albums) || null,
    guesses: [],
    hintsRevealed: [],
    blurLevel: 40,
    tileOrder: shuffleTiles(),
    gameStatus: 'playing',
    maxGuesses: 5,
  };
}

export function Game({ albums, mode, goal, ultraHard, onHome }) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [streak, setStreak] = useState(0);
  // Streak value at the moment it was broken, so the loss screen can show it
  const [lostStreak, setLostStreak] = useState(0);
  // Which album of this run we're on, shown in the header ("Album 7 · Endless")
  const [round, setRound] = useState(1);

  // Albums are loaded before Game mounts, so the first round can be created
  // directly in the initial state
  const [gameState, setGameState] = useState(() => newGame(albums));

  // Albums already shown this session, so they don't repeat until the
  // whole library has been played through. Seeded with the first round's album.
  const playedAlbumIdsRef = useRef(
    new Set(gameState.currentAlbum ? [gameState.currentAlbum.id] : [])
  );

  // Keep the streak available to the home screen's header chip
  useEffect(() => {
    localStorage.setItem('discStreak', String(streak));
  }, [streak]);

  const startNewGame = useCallback(() => {
    const played = playedAlbumIdsRef.current;
    let pool = albums.filter((a) => !played.has(a.id));
    if (pool.length === 0) {
      played.clear();
      pool = albums;
    }

    const next = newGame(pool);
    if (!next.currentAlbum) return;
    played.add(next.currentAlbum.id);
    setRound((r) => r + 1);
    setGameState(next);
  }, [albums]);

  // Continue / restart after an album ends. In a gauntlet, a finished run
  // (failed, or goal reached) resets the streak; a mid-run win keeps it going.
  const handlePlayAgain = useCallback(() => {
    if (goal != null && (gameState.gameStatus === 'lost' || streak >= goal)) {
      setStreak(0);
    }
    startNewGame();
  }, [goal, gameState.gameStatus, streak, startNewGame]);

  // Listen for Enter key on game over screen
  useEffect(() => {
    const isGameOver = gameState.gameStatus === 'won' || gameState.gameStatus === 'lost';

    if (!isGameOver) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handlePlayAgain();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameStatus, handlePlayAgain]);

  const handleGuess = (guess) => {
    if (!gameState.currentAlbum || gameState.gameStatus !== 'playing') return;

    const isCorrect = checkGuess(guess, gameState.currentAlbum.name);
    const newGuesses = [...gameState.guesses, guess];
    const guessNumber = newGuesses.length;

    if (isCorrect) {
      const allHints = generateHints(gameState.currentAlbum, gameState.maxGuesses);
      setStreak(s => s + 1);
      setGameState({
        ...gameState,
        guesses: newGuesses,
        hintsRevealed: allHints,
        gameStatus: 'won',
        blurLevel: 0,
      });
    } else if (guessNumber >= gameState.maxGuesses) {
      const allHints = generateHints(gameState.currentAlbum, gameState.maxGuesses);
      setLostStreak(streak);
      setStreak(0);
      setGameState({
        ...gameState,
        guesses: newGuesses,
        hintsRevealed: allHints,
        gameStatus: 'lost',
        blurLevel: 0,
      });
    } else {
      const hints = generateHints(gameState.currentAlbum, guessNumber);
      const blurLevel = calculateBlurLevel(guessNumber);

      setGameState({
        ...gameState,
        guesses: newGuesses,
        hintsRevealed: hints,
        blurLevel,
      });
    }
  };

  const handleSkipHint = () => {
    if (!gameState.currentAlbum || gameState.gameStatus !== 'playing') return;

    const newGuesses = [...gameState.guesses, '__skip__'];
    const nextHintLevel = newGuesses.length;

    if (nextHintLevel >= gameState.maxGuesses) {
      const allHints = generateHints(gameState.currentAlbum, gameState.maxGuesses);
      setLostStreak(streak);
      setStreak(0);
      setGameState({
        ...gameState,
        guesses: newGuesses,
        hintsRevealed: allHints,
        gameStatus: 'lost',
        blurLevel: 0,
      });
    } else {
      const hints = generateHints(gameState.currentAlbum, nextHintLevel);
      const blurLevel = calculateBlurLevel(nextHintLevel);
      setGameState({
        ...gameState,
        guesses: newGuesses,
        hintsRevealed: hints,
        blurLevel,
      });
    }
  };

  const handleSkip = () => {
    setStreak(0);
    startNewGame();
  };

  // Confirm before skipping if it would break an active streak
  const requestSkip = () => {
    if (streak > 0) {
      setShowSkipConfirm(true);
    } else {
      handleSkip();
    }
  };

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    handleSkip();
  };

  if (!gameState.currentAlbum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-lg text-ink-soft">Loading your albums...</p>
      </div>
    );
  }

  const isGameOver = gameState.gameStatus !== 'playing';

  // Gauntlet mode: goal is the target streak. In endless mode goal is null.
  const gauntletActive = goal != null;
  const gauntletComplete = gauntletActive && gameState.gameStatus === 'won' && streak >= goal;
  const gauntletFailed = gauntletActive && gameState.gameStatus === 'lost';

  const playAgainLabel = gauntletComplete
    ? 'New run'
    : gauntletFailed
      ? 'Try again'
      : 'Next album';

  return (
    <div className="min-h-screen bg-paper flex flex-col px-5 py-6">
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <header className="w-full max-w-md mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 mb-5">
          <button
            onClick={onHome}
            aria-label="Back to setup"
            className="w-9 h-9 flex items-center justify-center bg-cream border border-ink/12 rounded-full text-ink-soft hover:text-ink hover:border-ink/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="eyebrow text-ink/60 text-center">
            Album {round} · {gauntletActive ? `Gauntlet of ${goal}` : 'Endless'}
          </span>
          {gameState.gameStatus === 'lost' ? (
            <span className="px-3 py-1 bg-cream border border-ink/10 rounded-full eyebrow text-ink/50">
              <span className="text-accent">◆</span> Streak reset
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-cream border border-ink/10 rounded-full eyebrow text-accent-deep">
              <span className="text-accent">◆</span> {gauntletActive ? `${streak}/${goal}` : streak}
            </span>
          )}
        </header>

        {/* Album art — on desktop, cap the square against viewport height so the
            whole screen (header, results, actions) fits without scrolling.
            While guessing it also stays within the 28rem content column; on game
            over that clamp is dropped so the art can grow past the column and
            fill whatever space the viewport height allows. */}
        <div
          className={`relative mb-3 mx-auto w-full max-w-md transition-[max-width] duration-500 ease-out ${
            isGameOver
              ? 'sm:max-w-[max(14rem,min(100%,calc(100dvh-32rem)))]'
              : 'sm:max-w-[max(14rem,min(28rem,calc(100dvh-28rem)))]'
          }`}
        >
          <TiltedCover enabled={isGameOver}>
            <BlurredImage
              imageUrl={gameState.currentAlbum.imageUrl}
              blurLevel={gameState.blurLevel}
              altText="Album cover"
              mode={mode}
              tileOrder={gameState.tileOrder}
              revealedTileCount={isGameOver ? 6 : gameState.guesses.length + 1}
            />
          </TiltedCover>
          {!isGameOver && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-ink/85 rounded-full eyebrow text-cream">
              Guess {gameState.guesses.length + 1} / {gameState.maxGuesses}
            </div>
          )}
        </div>

        {/* Everything below the art stays in the regular content column */}
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* Guess progress segments */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: gameState.maxGuesses }).map((_, i) => {
            const guessWas = gameState.guesses[i];
            const isWon = gameState.gameStatus === 'won' && i === gameState.guesses.length - 1;
            const wasUsed = guessWas !== undefined;
            const isSkip = guessWas === '__skip__';
            const artistMatch = wasUsed && !isWon && !isSkip && (() => {
              const matched = findMatchingAlbum(guessWas, albums);
              return matched ? hasMatchingArtist(matched, gameState.currentAlbum) : false;
            })();

            const color = isWon
              ? 'bg-[#4E7C4E]'
              : isSkip
                ? 'bg-ink/25'
                : artistMatch
                  ? 'bg-[#D9A441]'
                  : wasUsed
                    ? 'bg-accent'
                    : 'bg-ink/10';

            return <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${color}`} />;
          })}
        </div>

        {isGameOver ? (
          <GameOver
            won={gameState.gameStatus === 'won'}
            album={gameState.currentAlbum}
            guessCount={gameState.guesses.length}
            guesses={gameState.guesses}
            albums={albums}
            streak={gameState.gameStatus === 'won' ? streak : lostStreak}
            goal={goal}
            gauntletComplete={gauntletComplete}
            gauntletFailed={gauntletFailed}
            playAgainLabel={playAgainLabel}
            onPlayAgain={handlePlayAgain}
          />
        ) : (
          <>
            {/* Guess input */}
            <div className="mb-4">
              <GuessInput
                key={gameState.currentAlbum.id}
                onGuess={handleGuess}
                onSkipHint={handleSkipHint}
                disabled={false}
                allAlbums={albums}
                currentAlbumId={gameState.currentAlbum.id}
                ultraHard={ultraHard}
              />
            </div>

            {/* Liner notes / hints */}
            <HintDisplay
              hints={gameState.hintsRevealed}
              currentGuess={gameState.guesses.length}
              maxGuesses={gameState.maxGuesses}
              guestMode={gameState.currentAlbum.source === 'itunes'}
            />

            {/* Skip - hidden in gauntlet mode (skipping would end the run) */}
            {!gauntletActive && (
              <div className="flex-1 flex flex-col justify-end items-center pt-6">
                <button
                  onClick={requestSkip}
                  className="px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
                >
                  Skip this album →
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Skip confirmation modal - only shown when skipping would break a streak */}
      {showSkipConfirm && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowSkipConfirm(false)}
        >
          <div
            className="bg-cream border border-ink/10 rounded-3xl max-w-sm w-full p-6 shadow-[0_24px_60px_rgba(43,33,26,0.35)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display font-black text-2xl text-ink mb-2">Skip this album?</p>
            <p className="text-sm text-ink-soft mb-6">
              You're on a streak of <span className="font-bold text-accent-deep">{streak}</span>. Skipping resets it
              to zero.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 px-4 py-3 bg-ink text-cream font-bold text-sm rounded-full hover:bg-ink/90 transition-all"
              >
                Keep playing
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 px-4 py-3 bg-cream border border-ink/15 text-ink font-bold text-sm rounded-full hover:border-ink/35 transition-all"
              >
                Skip anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
