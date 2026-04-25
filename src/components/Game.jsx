import { useState, useEffect } from 'react';
import { BlurredImage } from './BlurredImage';
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

export function Game({ albums, accessToken, onLogout }) {
  const [mode, setMode] = useState(() =>
    localStorage.getItem('gameMode') ?? 'blur'
  );

  const [showHelpModal, setShowHelpModal] = useState(false);

  const [gameState, setGameState] = useState({
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

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('gameMode', newMode);
  };

  const handleGuess = (guess) => {
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
              <svg className="w-8 h-8 flex-shrink-0 text-white" viewBox="0 0 24 24" fill="none">
                {/* Spotify logo arcs */}
                <path d="M6 6.5C8.5 5.5 10.5 5.5 13 6.5C15.5 7.5 17 8 18 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M7 9.5C9 8.8 11 8.8 13 9.5C15 10.2 16.5 10.5 17 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M8 12.5C9.5 12 11 12 12.5 12.5C14 13 15 13.2 15.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                {/* Question mark */}
                <path d="M10.5 17.5C10.5 16.8 10.8 16.5 11.3 16.2C11.8 16 12 15.8 12 15.3C12 14.9 11.7 14.6 11.3 14.6C10.9 14.6 10.6 14.9 10.6 15.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                <circle cx="11.3" cy="19.2" r="0.6" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">Album Cover Guesser</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Mode toggle */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5 text-xs font-semibold">
              {['blur', 'tile'].map(m => (
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
            {/* Help button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-8 h-8 flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-gray-400 hover:text-white transition-all"
              aria-label="How to play"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </button>
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-4 md:py-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-7 items-start">

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
              <div className="flex gap-1 md:gap-1.5 mb-1.5 md:mb-2">
                {Array.from({ length: gameState.maxGuesses }).map((_, i) => {
                  const guessWas = gameState.guesses[i];
                  const isWon = gameState.gameStatus === 'won' && i === gameState.guesses.length - 1;
                  const wasUsed = guessWas !== undefined && !isWon;
                  const isSkip = guessWas === '__skip__';
                  const artistMatch = wasUsed && !isSkip && (() => {
                    const matched = findMatchingAlbum(guessWas, albums);
                    return matched ? hasMatchingArtist(matched, gameState.currentAlbum) : false;
                  })();

                  let style = {};
                  let icon = null;
                  let base = 'border';

                  if (isWon) {
                    base += ' bg-[#1DB954] border-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.5)]';
                    icon = (
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    );
                  } else if (artistMatch) {
                    base += ' bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.25)]';
                    icon = (
                      <svg className="w-2 h-2 md:w-2.5 md:h-2.5" fill="none" stroke="#fbbf24" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    );
                  } else if (isSkip) {
                    base += ' bg-white/[0.06] border-white/[0.12]';
                    icon = (
                      <svg className="w-2 h-2 md:w-2.5 md:h-2.5" fill="none" stroke="#6b7280" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    );
                  } else if (wasUsed) {
                    base += ' bg-red-500/20 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
                    icon = (
                      <svg className="w-2 h-2 md:w-2.5 md:h-2.5" fill="none" stroke="#f87171" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    );
                  } else {
                    base += ' bg-white/[0.04] border-white/[0.08]';
                  }

                  return (
                    <div key={i} style={style} className={`flex-1 h-6 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 ${base}`}>
                      {icon}
                    </div>
                  );
                })}
              </div>
              {/* Progress bar - hidden on mobile, horizontal on desktop */}
              <div className="hidden md:block h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] transition-all duration-500"
                  style={{ width: `${(gameState.guesses.length / gameState.maxGuesses) * 100}%` }}
                />
              </div>
            </div>

            {/* Play Again button - desktop only, under progress bar */}
            {isGameOver && (
              <button
                onClick={startNewGame}
                className="hidden md:block w-full py-3.5 bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#1DB954]/20"
              >
                Play Again
              </button>
            )}
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
                {/* Hints panel - order-2 on mobile, order-1 on desktop */}
                <div className="order-2 md:order-1">
                  <HintDisplay
                    hints={gameState.hintsRevealed}
                    currentGuess={gameState.guesses.length}
                    maxGuesses={gameState.maxGuesses}
                    accessToken={accessToken}
                  />
                </div>

                {/* Previous guesses - order-3 on mobile, order-2 on desktop */}
                {gameState.guesses.length > 0 && (
                  <div className="order-3 md:order-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Previous Guesses</p>
                    <div className="flex flex-wrap gap-2">
                      {gameState.guesses.map((g, i) => {
                        // Handle skipped turns
                        if (g === '__skip__') {
                          return (
                            <span key={i} className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/[0.1] text-gray-500">
                              <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                              </svg>
                              Skipped
                            </span>
                          );
                        }

                        // Try to find matching album from user's library
                        const matchedAlbum = findMatchingAlbum(g, albums);

                        // Check if artist matches the current album
                        const artistMatches = matchedAlbum && hasMatchingArtist(matchedAlbum, gameState.currentAlbum);

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

                {/* Guess input - order-1 on mobile, order-3 on desktop */}
                <div className="order-1 md:order-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Your Guess</p>
                  <GuessInput
                    key={gameState.currentAlbum.id}
                    onGuess={handleGuess}
                    onSkipHint={handleSkipHint}
                    disabled={false}
                    allAlbums={albums}
                    currentAlbumId={gameState.currentAlbum.id}
                  />
                </div>

                {/* Skip - order-4, centered */}
                <div className="order-4 flex justify-center">
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

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-[#0f0f0f] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-white">How to Play</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Objective</h3>
                <p>Guess the album from your Liked Songs Spotify library in 5 tries or less.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Game Modes</h3>
                <ul className="space-y-2 ml-4">
                  <li className="flex gap-2">
                    <span className="text-[#1DB954]">•</span>
                    <div>
                      <strong className="text-white">Blur:</strong> The album cover starts heavily blurred and becomes clearer with each guess.
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#1DB954]">•</span>
                    <div>
                      <strong className="text-white">Tile:</strong> The album cover is divided into tiles. One tile reveals with each guess.
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Hints</h3>
                <p>After each incorrect guess, you'll receive a hint about the album (release year, track count, artist info, etc.).</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Skip Hint</h3>
                <p>Use the "Skip for hint" button to skip a guess and reveal the next hint without submitting an answer.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Guess Indicators</h3>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Green = Correct guess</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yellow-400">✕</span>
                    <span>Yellow = Wrong album, but same artist</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Red = Wrong album and artist</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gray-400">→</span>
                    <span>Gray = Skipped for hint</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-6 px-4 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-lg transition-colors"
            >
              Got it!
            </button>

            <div className="mt-4 text-left">
              <p className="text-xs text-gray-600">
                Made by{' '}
                <a
                  href="https://github.com/pmarch11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#1DB954] transition-colors underline"
                >
                  Patric Marchant
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
