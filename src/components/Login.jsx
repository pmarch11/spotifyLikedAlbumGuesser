import { Disc } from './Disc';
import { GUEST_POOLS } from '../utils/itunes';

function SpotifyLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function Login({ onLogin, onGuestStart, error }) {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center text-center gap-8">
        {/* Badge */}
        <span className="eyebrow text-ink/50 border border-ink/15 rounded-full px-4 py-1.5">
          An album cover guessing game
        </span>

        {/* CD illustration */}
        <Disc className="w-64 h-64 drop-shadow-[0_16px_30px_rgba(43,33,26,0.3)]" />

        {/* Title + tagline */}
        <div className="space-y-4">
          <h1 className="font-display font-black text-6xl leading-[0.95] text-ink">
            Disc<br />Cover
          </h1>
          <p className="text-ink-soft leading-relaxed max-w-[17rem] mx-auto">
            Guess album covers from a genres, or your Spotify liked songs.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full p-3.5 bg-accent/10 border border-accent/30 rounded-2xl animate-fadeIn">
            <p className="text-sm font-medium text-accent-deep">{error}</p>
          </div>
        )}

        {/* Guest decks — playable by anyone, no account needed */}
        <div className="w-full space-y-4">
          <p className="eyebrow text-ink/40">Pick a deck — no account needed</p>
          <div className="flex flex-wrap justify-center gap-2">
            {GUEST_POOLS.map((pool) => (
              <button
                key={pool.id}
                onClick={() => onGuestStart(pool.id)}
                className="px-4 py-2 bg-cream border border-ink/15 hover:border-ink/40 text-ink text-sm font-bold rounded-full transition-all active:scale-[0.97]"
              >
                {pool.name}
              </button>
            ))}
          </div>
        </div>

        {/* Spotify login — secondary since most users can't log in */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-ink/10" />
            <span className="eyebrow text-ink/40">or use your own library</span>
            <span className="flex-1 h-px bg-ink/10" />
          </div>
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-ink hover:bg-ink/90 text-cream font-bold rounded-full transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-[0_12px_30px_rgba(43,33,26,0.25)]"
          >
            <SpotifyLogo className="w-5 h-5 flex-shrink-0" />
            Continue with Spotify
          </button>
        </div>
      </div>

      {/* Credit */}
      <a
        href="https://github.com/pmarch11"
        target="_blank"
        rel="noopener noreferrer"
        className="eyebrow text-ink/40 hover:text-accent transition-colors mt-8"
      >
        Made by Patric Marchant
      </a>
    </div>
  );
}
