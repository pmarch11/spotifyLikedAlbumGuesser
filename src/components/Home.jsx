import { useState } from 'react';

const MODES = [
  {
    id: 'blur',
    title: 'Blur',
    description: 'Starts fuzzy, sharpens with every guess.',
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="homeBlurIcon" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#C9B79B" />
            <stop offset="100%" stopColor="#5C4A38" />
          </radialGradient>
        </defs>
        <rect x="4" y="4" width="28" height="28" rx="8" fill="url(#homeBlurIcon)" />
      </svg>
    ),
  },
  {
    id: 'tile',
    title: 'Tiles',
    description: 'Six panels. One flips per guess.',
    icon: (
      <svg className="w-9 h-9" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="12" height="12" rx="3" fill="#5C4A38" />
        <rect x="20" y="4" width="12" height="12" rx="3" fill="none" stroke="#5C4A38" strokeWidth="2" opacity="0.5" />
        <rect x="4" y="20" width="12" height="12" rx="3" fill="none" stroke="#5C4A38" strokeWidth="2" opacity="0.5" />
        <rect x="20" y="20" width="12" height="12" rx="3" fill="#C9B79B" />
      </svg>
    ),
  },
];

const RUN_LENGTHS = [
  { id: 'endless', label: 'Endless', goal: null },
  { id: '3', label: '3', goal: 3 },
  { id: '5', label: '5', goal: 5 },
  { id: '10', label: '10', goal: 10 },
];

export function Home({ onStart, onLogout }) {
  const [mode, setMode] = useState(() => localStorage.getItem('gameMode') ?? 'blur');
  const [ultraHard, setUltraHard] = useState(() => localStorage.getItem('ultraHard') === 'true');
  const [runLength, setRunLength] = useState(() => {
    const saved = localStorage.getItem('runLength');
    return RUN_LENGTHS.some((r) => r.id === saved) ? saved : 'endless';
  });

  // Current streak carried over from the last session, shown in the header chip
  const streak =
    Number(localStorage.getItem('discStreak') ?? localStorage.getItem('needleStreak')) || 0;

  const start = () => {
    localStorage.setItem('gameMode', mode);
    localStorage.setItem('ultraHard', String(ultraHard));
    localStorage.setItem('runLength', runLength);
    const goal = RUN_LENGTHS.find((r) => r.id === runLength).goal;
    onStart(mode, goal, ultraHard);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col px-5 py-6">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <span className="eyebrow text-ink">Disc Cover</span>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-cream border border-ink/10 rounded-full eyebrow text-accent-deep">
                <span className="text-accent">◆</span> {streak} streak
              </span>
            )}
            <button
              onClick={onLogout}
              className="text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Title */}
        <h1 className="font-display font-black text-4xl text-ink mb-7">Set up your run</h1>

        {/* Reveal mode */}
        <p className="eyebrow text-ink/50 mb-3">How the cover reveals</p>
        <div className="grid grid-cols-2 gap-3 mb-7">
          {MODES.map((m) => {
            const selected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                aria-pressed={selected}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl text-left bg-cream transition-all ${
                  selected
                    ? 'border-2 border-ink shadow-[0_8px_20px_rgba(43,33,26,0.1)]'
                    : 'border border-ink/12 hover:border-ink/30'
                }`}
              >
                {m.icon}
                <span className="text-base font-bold text-ink">{m.title}</span>
                <span className="text-xs text-ink-soft leading-snug">{m.description}</span>
              </button>
            );
          })}
        </div>

        {/* Run length */}
        <p className="eyebrow text-ink/50 mb-3">Run length</p>
        <div className="grid grid-cols-4 gap-2.5 mb-3">
          {RUN_LENGTHS.map((r) => {
            const selected = runLength === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRunLength(r.id)}
                aria-pressed={selected}
                className={`py-3 rounded-full text-sm font-bold transition-all ${
                  selected
                    ? 'bg-accent text-cream shadow-[0_8px_18px_rgba(207,91,39,0.35)]'
                    : 'bg-cream border border-ink/12 text-ink hover:border-ink/30'
                }`}
              >
                {r.id === 'endless' ? <span>∞ {r.label}</span> : r.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-soft leading-relaxed mb-7">
          Pick a number for a gauntlet — clear it without a single miss, or the run ends.
        </p>

        {/* Ultra hard */}
        <div className="flex items-center justify-between gap-4 px-4 py-4 bg-cream border border-ink/12 rounded-2xl">
          <div>
            <p className="text-base font-bold text-ink">Ultra hard</p>
            <p className="text-xs text-ink-soft mt-0.5">
              Suggestions show album names only — no artists.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ultraHard}
            aria-label="Ultra hard mode"
            onClick={() => setUltraHard((v) => !v)}
            className={`relative w-12 h-7 flex-shrink-0 rounded-full transition-colors ${
              ultraHard ? 'bg-accent' : 'bg-ink/15'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-cream rounded-full shadow transition-transform ${
                ultraHard ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Start */}
        <div className="flex-1 flex flex-col justify-end pt-8">
          <button
            onClick={start}
            className="w-full py-4 bg-accent hover:bg-accent-deep text-cream font-bold text-lg rounded-full transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-[0_14px_30px_rgba(207,91,39,0.35)]"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
