import { useState, useRef, useEffect } from 'react';
import type { Hint } from '../types/spotify';

interface HintDisplayProps {
  hints: Hint[];
  currentGuess: number;
  maxGuesses: number;
  accessToken: string | null;
}

function PreviewButton({ value, accessToken }: { value: string; accessToken: string | null }) {
  const isTrackId = value.startsWith('spotify:track:');
  const trackId = isTrackId ? value.replace('spotify:track:', '') : null;

  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'unavailable'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setState('playing');
    setSecondsLeft(3);

    let count = 3;
    intervalRef.current = setInterval(() => {
      count--;
      setSecondsLeft(count);
      if (count <= 0) {
        audio.pause();
        audio.currentTime = 0;
        setState('idle');
        setSecondsLeft(3);
        clearInterval(intervalRef.current!);
      }
    }, 1000);
  };

  const handleClick = async () => {
    if (state !== 'idle') return;

    // Direct audio URL — play immediately
    if (!isTrackId) {
      playAudio(value);
      return;
    }

    // Track ID — fetch preview URL from Spotify API
    setState('loading');
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}?market=from_token`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.preview_url) {
        playAudio(data.preview_url);
      } else {
        setState('unavailable');
      }
    } catch {
      setState('unavailable');
    }
  };

  if (state === 'unavailable') {
    return <span className="text-gray-500 text-sm italic">Preview not available for this track</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
        state === 'playing'
          ? 'bg-[#1DB954]/20 text-[#1DB954] cursor-default'
          : state === 'loading'
          ? 'bg-[#1DB954]/10 text-[#1DB954]/60 cursor-default'
          : 'bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954]'
      }`}
    >
      {state === 'playing' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
          {secondsLeft}s
        </>
      ) : state === 'loading' ? (
        <>
          <span className="w-2 h-2 rounded-full border border-[#1DB954]/60 animate-spin border-t-transparent" />
          Loading...
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play 3s preview
        </>
      )}
    </button>
  );
}

export function HintDisplay({ hints, currentGuess, maxGuesses, accessToken }: HintDisplayProps) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 flex-shrink-0 bg-[#1DB954]/15 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#1DB954]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Hints Unlocked
        </span>
      </div>

      {/* Hints list */}
      {hints.length > 0 ? (
        <div className="space-y-2.5">
          {hints.map((hint, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 animate-fadeIn"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954] text-[10px] font-bold">
                {index + 1}
              </span>
              {hint.type === 'preview' ? (
                <PreviewButton value={hint.value as string} accessToken={accessToken} />
              ) : (
                <span className="text-gray-200 text-sm font-medium leading-snug">{hint.label}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 italic">
          Make a guess to unlock your first hint.
        </p>
      )}

      {/* Footer */}
      {currentGuess < maxGuesses && hints.length < maxGuesses - 1 && (
        <p className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-gray-600">
          A new hint unlocks with each wrong guess
        </p>
      )}
    </div>
  );
}
