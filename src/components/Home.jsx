import { useState } from 'react';

const MODES = [
  {
    id: 'blur',
    title: 'Blur',
    description: 'The cover starts heavily blurred and sharpens with each guess.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <defs>
          <filter id="homeBlurIcon" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <circle cx="12" cy="12" r="6.5" filter="url(#homeBlurIcon)" />
      </svg>
    ),
  },
  {
    id: 'tile',
    title: 'Tile',
    description: 'The cover is split into 6 tiles. One tile reveals with each guess.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" opacity="0.4" />
        <rect x="3" y="14" width="7" height="7" rx="1" opacity="0.4" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
];

const GAUNTLETS = [
  { id: 'beginner', title: 'Beginner', goal: 3 },
  { id: 'intermediate', title: 'Intermediate', goal: 5 },
  { id: 'expert', title: 'Expert', goal: 10 },
];

export function Home({ onStart, onLogout }) {
  const [mode, setMode] = useState(() => localStorage.getItem('gameMode') ?? 'blur');
  // 'main' shows the Endless / Gauntlet buttons; 'gauntlet' shows the difficulty picker
  const [view, setView] = useState('main');

  const start = (goal) => {
    localStorage.setItem('gameMode', mode);
    onStart(mode, goal);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black px-4 py-10 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#1DB954] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#1ed760] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col justify-center text-center space-y-8">
        {/* Icon + Title */}
        <div className="space-y-5">
          <div className="flex justify-center">
            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-[#1DB954] to-[#1aa34a] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#1DB954]/40">
              <svg className="w-16 h-16 flex-shrink-0 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M4 5C7.5 3.5 10.5 3.5 14 5C17.5 6.5 19.5 7.5 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M5.5 9C8.5 7.8 11.5 7.8 14.5 9C17.5 10.2 19 10.8 19.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7 13C9.5 12 12 12 14.5 13C17 14 18 14.5 18.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 19C10 18 10.5 17.5 11.2 17C11.9 16.6 12.2 16.3 12.2 15.5C12.2 14.8 11.7 14.3 11 14.3C10.3 14.3 9.8 14.8 9.8 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="11" cy="21.5" r="0.8" fill="currentColor" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">Album Cover Guesser</h1>
          <p className="text-gray-400 leading-relaxed">
            Guess albums from your liked songs as the cover reveals itself and you get gradual hints.
          </p>
        </div>

        {/* Mode selection */}
        <div className="space-y-3 text-left">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">Choose a mode</p>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map(m => {
              const selected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  aria-pressed={selected}
                  className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all ${
                    selected
                      ? 'bg-[#1DB954]/10 border-[#1DB954] shadow-lg shadow-[#1DB954]/10'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.18]'
                  }`}
                >
                  <span className={selected ? 'text-[#1DB954]' : 'text-gray-400'}>{m.icon}</span>
                  <span className="text-sm font-bold text-white">{m.title}</span>
                  <span className="text-xs text-gray-500 leading-snug">{m.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Game modes */}
        {view === 'main' ? (
          <div className="space-y-3">
            <button
              onClick={() => start(null)}
              className="w-full py-4 bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold text-base rounded-full transition-all duration-200 shadow-2xl shadow-[#1DB954]/30 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Endless mode
            </button>
            <button
              onClick={() => setView('gauntlet')}
              className="w-full py-4 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white font-bold text-base rounded-full transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Gauntlet mode
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">
              How many in a row?
            </p>
            {GAUNTLETS.map(g => (
              <button
                key={g.id}
                onClick={() => start(g.goal)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-[#1DB954]/50 rounded-2xl transition-all duration-200 group"
              >
                <span className="text-sm font-bold text-white">{g.title}</span>
                <span className="text-xs font-bold text-gray-400 group-hover:text-[#1DB954] transition-colors">
                  {g.goal} in a row
                </span>
              </button>
            ))}
            <button
              onClick={() => setView('main')}
              className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="relative z-10 flex justify-center pt-6">
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] rounded-lg text-gray-400 hover:text-white text-xs font-semibold transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
