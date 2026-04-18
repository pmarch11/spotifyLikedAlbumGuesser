import { useState, useEffect } from 'react';
import { BlurredImage } from './BlurredImage';
import { GuessInput } from './GuessInput';
import { HintDisplay } from './HintDisplay';
import { GameOver } from './GameOver';
import { selectRandomAlbum, checkGuess, generateHints, calculateBlurLevel, findMatchingAlbum, hasMatchingArtist } from '../utils/gameLogic';
import type { GameAlbum, GameMode, GameState } from '../types/spotify';

function shuffleTiles(): number[] {
  const arr = [0, 1, 2, 3, 4, 5];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface GameProps {
  albums: GameAlbum[];
  accessToken: string | null;
  onLogout: () => void;
}

export function Game({ albums, accessToken, onLogout }: GameProps) {
  const [mode, setMode] = useState<GameMode>(() =>
    (localStorage.getItem('gameMode') as GameMode) ?? 'blur'
  );

  const [gameState, setGameState] = useState<GameState>({
    currentAlbum: null,
    guesses: [],
    hintsRevealed: [],
    blurLevel: 40,
    tileOrder: shuffleTiles(),
    gameStatus: 'playing',
    maxGuesses: 5,
  });

  // Initialize game with random album
  useEffect(() => {
    startNewGame();
  }, [albums]);

  const startNewGame = () => {
    const album = selectRandomAlbum(albums);
    if (!album) return;

    setGameState({
      currentAlbum: album,
      guesses: [],
      hintsRevealed: [],
      blurLevel: 40,
      tileOrder: shuffleTiles(),
      gameStatus: 'playing',
      maxGuesses: 5,
    });
  };

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    localStorage.setItem('gameMode', newMode);
    startNewGame();
  };

  const handleGuess = (guess: string) => {
    if (!gameState.currentAlbum || gameState.gameStatus !== 'playing') return;

    const isCorrect = checkGuess(guess, gameState.currentAlbum.name);
    const newGuesses = [...gameState.guesses, guess];
    const guessNumber = newGuesses.length;

    if (isCorrect) {
      const allHints = generateHints(gameState.currentAlbum, gameState.maxGuesses);
      setGameState({
        ...gameState,
        guesses: newGuesses,
        hintsRevealed: allHints,
        gameStatus: 'won',
        blurLevel: 0,
      });
    } else if (guessNumber >= gameState.maxGuesses) {
      const allHints = generateHints(gameState.currentAlbum, gameState.maxGuesses);
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
    startNewGame();
  };

  if (!gameState.currentAlbum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-xl text-gray-300">Loading your albums...</p>
      </div>
    );
  }

  const isGameOver = gameState.gameStatus !== 'playing';
  const guessesLeft = gameState.maxGuesses - gameState.guesses.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 flex-shrink-0 text-white" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">Album Guesser</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Mode toggle */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5 text-xs font-semibold">
              {(['blur', 'tile'] as GameMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`px-3 py-1 rounded-md transition-all capitalize ${
                    mode === m
                      ? 'bg-[#1DB954] text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {!isGameOver && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs font-semibold text-gray-400">
                <span className="text-[#1DB954]">{guessesLeft}</span>
                <span>{guessesLeft === 1 ? 'guess' : 'guesses'} left</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] rounded-lg text-gray-400 hover:text-white text-xs font-semibold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Main 2-column layout ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">

          {/* ── LEFT: Album art + progress ── */}
          <div className="flex flex-col gap-4">
            {/* Image */}
            <div className="relative">
              <BlurredImage
                imageUrl={gameState.currentAlbum.imageUrl}
                blurLevel={gameState.blurLevel}
                altText="Album cover"
                mode={mode}
                tileOrder={gameState.tileOrder}
                revealedTileCount={isGameOver ? 6 : gameState.guesses.length + 1}
              />
              {/* Guess count chip over the image */}
              {!isGameOver && (
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white">
                  {gameState.guesses.length} / {gameState.maxGuesses}
                </div>
              )}
            </div>

            {/* Guess dots + progress bar */}
            <div>
              <div className="flex gap-1.5 mb-2">
                {Array.from({ length: gameState.maxGuesses }).map((_, i) => {
                  const guessWas = gameState.guesses[i];
                  const isWon = gameState.gameStatus === 'won' && i === gameState.guesses.length - 1;
                  const wasUsed = guessWas !== undefined && !isWon;
                  const isSkip = guessWas === '__skip__';
                  const artistMatch = wasUsed && !isSkip && (() => {
                    const matched = findMatchingAlbum(guessWas, albums);
                    return matched ? hasMatchingArtist(matched, gameState.currentAlbum!) : false;
                  })();

                  let style: React.CSSProperties = {};
                  let icon = null;
                  let base = 'border';

                  if (isWon) {
                    base += ' bg-[#1DB954] border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.5)]';
                    icon = (
                      <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    );
                  } else if (artistMatch) {
                    base += ' bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.25)]';
                    icon = (
                      <svg width="10" height="10" fill="none" stroke="#fbbf24" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    );
                  } else if (isSkip) {
                    base += ' bg-white/[0.06] border-white/[0.12]';
                    icon = (
                      <svg width="10" height="10" fill="none" stroke="#6b7280" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    );
                  } else if (wasUsed) {
                    base += ' bg-red-500/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
                    icon = (
                      <svg width="10" height="10" fill="none" stroke="#f87171" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    );
                  } else {
                    base += ' bg-white/[0.04] border-white/[0.08]';
                  }

                  return (
                    <div key={i} style={style} className={`flex-1 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${base}`}>
                      {icon}
                    </div>
                  );
                })}
              </div>
              <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] transition-all duration-500"
                  style={{ width: `${(gameState.guesses.length / gameState.maxGuesses) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">
                {mode === 'tile' ? 'A new tile reveals with each guess' : 'Blur reduces with each guess'}
              </p>
            </div>
          </div>

          {/* ── RIGHT: Hints / game over + guesses + input ── */}
          <div className="flex flex-col gap-4">
            {isGameOver ? (
              <GameOver
                won={gameState.gameStatus === 'won'}
                albumName={gameState.currentAlbum.name}
                artistNames={gameState.currentAlbum.mainArtists}
                albumUri={gameState.currentAlbum.uri}
                guessCount={gameState.guesses.length}
                guesses={gameState.guesses}
                maxGuesses={gameState.maxGuesses}
                hints={gameState.hintsRevealed}
                albums={albums}
                currentAlbum={gameState.currentAlbum}
                onPlayAgain={startNewGame}
              />
            ) : (
              <>
                {/* Hints panel */}
                <HintDisplay
                  hints={gameState.hintsRevealed}
                  currentGuess={gameState.guesses.length}
                  maxGuesses={gameState.maxGuesses}
                  accessToken={accessToken}
                />

                {/* Previous wrong guesses */}
                {gameState.guesses.some(g => g !== '__skip__') && (
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Previous Guesses</p>
                    <div className="flex flex-wrap gap-2">
                      {gameState.guesses.filter(g => g !== '__skip__').map((g, i) => {
                        // Try to find matching album from user's library
                        const matchedAlbum = findMatchingAlbum(g, albums);

                        // Check if artist matches the current album
                        const artistMatches = matchedAlbum && hasMatchingArtist(matchedAlbum, gameState.currentAlbum!);

                        // Display text: "Artist - Album" if matched, otherwise just the guess
                        const displayText = matchedAlbum
                          ? `${matchedAlbum.mainArtists.join(', ')} - ${matchedAlbum.name}`
                          : g;

                        // Color: yellow if artist matches, red otherwise
                        const colorClasses = artistMatches
                          ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                          : 'bg-red-500/10 border-red-500/25 text-red-400';

                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}
                          >
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {displayText}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Guess input */}
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Your Guess</p>
                  <GuessInput
                    onGuess={handleGuess}
                    onSkipHint={handleSkipHint}
                    disabled={false}
                    allAlbums={albums}
                    currentAlbumId={gameState.currentAlbum.id}
                  />
                </div>

                {/* Skip */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-400 border border-white/[0.08] hover:border-white/[0.14] rounded-lg transition-all"
                  >
                    Skip this album →
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
