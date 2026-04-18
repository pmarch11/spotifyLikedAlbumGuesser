import type { Hint, GameAlbum } from '../types/spotify';
import { findMatchingAlbum, hasMatchingArtist } from '../utils/gameLogic';

interface GameOverProps {
  won: boolean;
  albumName: string;
  artistNames: string[];
  albumUri: string;
  guessCount: number;
  guesses: string[];
  maxGuesses: number;
  hints: Hint[];
  albums: GameAlbum[];
  currentAlbum: GameAlbum;
  onPlayAgain: () => void;
  onSkip?: () => void;
}

export function GameOver({
  won,
  albumName,
  artistNames,
  albumUri,
  guessCount,
  guesses,
  maxGuesses,
  hints,
  albums,
  currentAlbum,
  onPlayAgain,
}: GameOverProps) {
  const openInSpotify = () => {
    window.open(albumUri, '_blank');
  };

  const { resultEmoji, resultTitle, resultSubtitle } = !won
    ? { resultEmoji: '😔', resultTitle: 'So Close!', resultSubtitle: 'Used all 5 guesses' }
    : guessCount === 1 ? { resultEmoji: '🔥', resultTitle: 'First Try!', resultSubtitle: 'Absolute legend' }
    : guessCount === 2 ? { resultEmoji: '🎯', resultTitle: 'Sharp Ears!', resultSubtitle: 'Guessed in 2 tries' }
    : guessCount === 3 ? { resultEmoji: '🎉', resultTitle: 'Got it!', resultSubtitle: 'Guessed in 3 tries' }
    : guessCount === 4 ? { resultEmoji: '😅', resultTitle: 'Just in Time!', resultSubtitle: 'Guessed in 4 tries' }
    : { resultEmoji: '😤', resultTitle: 'Squeaked Through!', resultSubtitle: 'Guessed in 5 tries' };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Result banner */}
      <div className={`rounded-2xl p-5 text-center border ${won
        ? 'bg-[#1DB954]/[0.07] border-[#1DB954]/25'
        : 'bg-red-500/[0.06] border-red-500/20'
      }`}>
        <div className="text-4xl mb-2">{resultEmoji}</div>
        <h2 className={`text-2xl font-black mb-1 ${won ? 'text-[#1DB954]' : 'text-red-400'}`}>
          {resultTitle}
        </h2>
        <p className="text-gray-400 text-sm">{resultSubtitle}</p>

        {/* Guess result dots */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxGuesses }).map((_, i) => {
            const isWin = won && i === guessCount - 1;
            const isWrong = i < guesses.length && !isWin;
            const isEmpty = i >= guesses.length;
            const g = guesses[i];
            const isSkip = g === '__skip__';
            const artistMatch = isWrong && !isSkip && (() => {
              const matched = findMatchingAlbum(g, albums);
              return matched ? hasMatchingArtist(matched, currentAlbum) : false;
            })();

            return (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs transition-all ${
                  isWin
                    ? 'bg-[#1DB954] border-[#1DB954]'
                    : artistMatch
                    ? 'bg-yellow-500/25 border-yellow-500/40'
                    : isWrong
                    ? 'bg-red-500/25 border-red-500/40'
                    : isEmpty
                    ? 'bg-white/[0.06] border-white/[0.08]'
                    : 'bg-white/[0.06] border-white/[0.08]'
                }`}
              >
                {isWin && (
                  <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {(isWrong || artistMatch) && !isWin && (
                  <svg width="11" height="11" fill="none" stroke={artistMatch ? '#eab308' : '#f87171'} strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Album info */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">The Album Was</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-black text-white leading-tight">{albumName}</p>
            <p className="text-sm text-gray-400 mt-0.5">by {artistNames.join(', ')}</p>
          </div>
          <button
            onClick={openInSpotify}
            title="Open in Spotify"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white rounded-lg transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* All hints (always shown) */}
      {hints.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">All Hints</p>
          <div className="space-y-2">
            {hints.map((hint, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#1DB954]/15 flex items-center justify-center text-[#1DB954] text-[9px] font-bold mt-0.5">{i + 1}</span>
                <span className="text-gray-300 text-xs">{hint.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All guesses (shown on loss) */}
      {!won && guesses.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Your Guesses</p>
          <div className="flex flex-wrap gap-1.5">
            {guesses.map((g, i) => {
              // Render skipped turns as a distinct grey pill
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
              const artistMatches = matchedAlbum && hasMatchingArtist(matchedAlbum, currentAlbum);

              // Display text: "Artist - Album" if matched, otherwise just the guess
              const displayText = matchedAlbum
                ? `${matchedAlbum.mainArtists.join(', ')} - ${matchedAlbum.name}`
                : g;

              // Color: yellow if artist matches, red otherwise
              const colorClasses = artistMatches
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'bg-red-500/10 border-red-500/25 text-red-400';

              return (
                <span key={i} className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}>
                  <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {displayText}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <button
        onClick={onPlayAgain}
        className="w-full py-3.5 bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#1DB954]/20"
      >
        Play Again
      </button>
    </div>
  );
}
