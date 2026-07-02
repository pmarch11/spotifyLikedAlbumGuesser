// Teaser labels for hints that haven't unlocked yet, in unlock order
const HINT_TEASERS = [
  'Year & track count',
  'Featured artists',
  'First letter & word count',
  'Liked song titles',
];

export function HintDisplay({ hints, maxGuesses }) {
  const totalHints = maxGuesses - 1; // one hint unlocks per miss, last miss ends the round

  return (
    <div className="bg-card border border-ink/10 rounded-2xl p-4">
      <p className="eyebrow text-ink/50 mb-3">Liner notes · Hints</p>

      <div className="space-y-2.5">
        {Array.from({ length: totalHints }).map((_, i) => {
          const revealed = i < hints.length;
          const isNext = i === hints.length;
          const number = String(i + 1).padStart(2, '0');

          return (
            <div key={i}>
              {/* Dashed divider between revealed hints and locked ones */}
              {isNext && hints.length > 0 && (
                <div className="border-t border-dashed border-ink/20 mb-2.5" />
              )}
              <div className={`flex items-baseline gap-2.5 ${revealed ? 'animate-fadeIn' : ''}`}>
                <span className={`eyebrow ${revealed ? 'text-accent' : 'text-ink/30'}`}>{number}</span>
                {revealed ? (
                  <span className="text-sm font-semibold text-ink leading-snug">{hints[i].label}</span>
                ) : (
                  <span className="text-sm text-ink/40 leading-snug">{HINT_TEASERS[i]}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
