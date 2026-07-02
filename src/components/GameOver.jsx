import { findMatchingAlbum, hasMatchingArtist } from '../utils/gameLogic';

function SpotifyLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function GameOver({
  won,
  album,
  guessCount,
  guesses,
  albums,
  streak,
  goal,
  gauntletComplete,
  gauntletFailed,
  playAgainLabel,
  onPlayAgain,
}) {
  const gauntletActive = goal != null;

  const winTitle =
    guessCount === 1 ? 'First try.'
    : guessCount === 2 ? 'Sharp ears.'
    : guessCount <= 4 ? 'Got it.'
    : 'Just made it.';

  const { title, subtitle } = gauntletComplete
    ? { title: 'Gauntlet cleared.', subtitle: `${goal} in a row, no misses. The album was —` }
    : gauntletFailed
      ? { title: 'Run over.', subtitle: `Made it to ${streak} of ${goal}. The album was —` }
      : won
        ? {
            title: winTitle,
            subtitle: guessCount === 1
              ? 'One guess. The album was —'
              : `Guessed in ${guessCount}. The album was —`,
          }
        : { title: 'So close.', subtitle: 'All five guesses used. The album was —' };

  // Wrong guesses become chips; skipped turns collapse into one "skipped ×N" chip.
  // On a win the last guess was correct, so it's not shown.
  const missedTurns = won ? guesses.slice(0, -1) : guesses;
  const wrongGuesses = missedTurns.filter((g) => g !== '__skip__');
  const skipCount = missedTurns.filter((g) => g === '__skip__').length;

  return (
    <div className="flex-1 flex flex-col animate-fadeIn">
      {/* Result */}
      <h2 className="font-display font-black text-4xl text-ink mt-2 mb-1.5">{title}</h2>
      <p className="text-ink-soft mb-4">{subtitle}</p>

      {/* Album card */}
      <div className="flex items-center justify-between gap-3 p-4 bg-card border border-ink/10 rounded-2xl mb-4">
        <div className="min-w-0">
          <p className="font-display font-bold text-xl text-ink leading-tight">{album.name}</p>
          <p className="text-sm text-ink-soft mt-0.5">
            {album.mainArtists.join(', ')} · {album.releaseYear}
          </p>
        </div>
        <button
          onClick={() => window.open(album.uri, '_blank')}
          className="flex-shrink-0 flex items-center gap-2 pl-3.5 pr-4 py-2.5 bg-ink hover:bg-ink/90 text-cream text-sm font-bold rounded-full transition-all"
        >
          {album.source === 'itunes' ? (
            <span className="text-base leading-none">♪</span>
          ) : (
            <SpotifyLogo className="w-4 h-4" />
          )}
          {album.source === 'itunes' ? 'Open in Apple Music' : 'Open in Spotify'}
        </button>
      </div>

      {/* Gauntlet progress (mid-run) */}
      {gauntletActive && !gauntletComplete && !gauntletFailed && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: goal }).map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i < streak ? 'bg-accent' : 'bg-ink/15'}`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-ink-soft">{streak} / {goal} — no misses allowed</span>
        </div>
      )}

      {/* Guess chips */}
      {(wrongGuesses.length > 0 || skipCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {wrongGuesses.map((g, i) => {
            const matched = findMatchingAlbum(g, albums);
            const artistMatches = matched && hasMatchingArtist(matched, album);
            const label = matched ? matched.name : g;
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  artistMatches
                    ? 'bg-[#D9A441]/15 border-[#D9A441]/40 text-[#8A6516]'
                    : 'bg-cream border-ink/12 text-ink-soft'
                }`}
                title={artistMatches ? 'Right artist, wrong album' : undefined}
              >
                <span className={artistMatches ? 'text-[#B78420]' : 'text-accent'}>×</span> {label}
              </span>
            );
          })}
          {skipCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-cream border border-ink/12 text-ink-soft">
              → skipped ×{skipCount}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex-1 flex flex-col justify-end gap-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 bg-accent hover:bg-accent-deep text-cream font-bold text-lg rounded-full transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-[0_14px_30px_rgba(207,91,39,0.35)]"
        >
          {playAgainLabel}
        </button>
      </div>
    </div>
  );
}
