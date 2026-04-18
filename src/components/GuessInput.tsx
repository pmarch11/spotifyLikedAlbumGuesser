import { useState, useRef, useEffect, type FormEvent } from 'react';
import type { GameAlbum } from '../types/spotify';
import { normalizeString } from '../utils/gameLogic';

interface GuessInputProps {
  onGuess: (guess: string) => void;
  onSkipHint: () => void;
  disabled: boolean;
  allAlbums: GameAlbum[];
  currentAlbumId: string;
}

export function GuessInput({ onGuess, onSkipHint, disabled, allAlbums, currentAlbumId }: GuessInputProps) {
  const [guess, setGuess] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const suggestions = guess.length >= 3
    ? allAlbums
        .filter(album => {
          const searchTerm = normalizeString(guess);
          const albumName = normalizeString(album.name);
          const artistNames = normalizeString(album.mainArtists.join(' '));
          return albumName.includes(searchTerm) || artistNames.includes(searchTerm);
        })
        .slice(0, 8)
    : [];

  useEffect(() => {
    setShowSuggestions(suggestions.length > 0 && guess.length >= 3);
    setSelectedIndex(0);
  }, [guess, suggestions.length]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onGuess(guess.trim());
      setGuess('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (albumName: string) => {
    setGuess(albumName);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex].name);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type an album name…"
            autoComplete="off"
            className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#1DB954]/60 focus:ring-1 focus:ring-[#1DB954]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1.5 bg-[#1a1a1a] border border-white/[0.1] rounded-xl shadow-2xl max-h-64 overflow-y-auto"
            >
              {suggestions.map((album, index) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => handleSuggestionClick(album.name)}
                  className={`w-full px-3.5 py-2.5 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-[#1DB954]/15 border-l-2 border-[#1DB954]'
                      : 'hover:bg-white/[0.05] border-l-2 border-transparent'
                  } ${index !== suggestions.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
                >
                  <div className="text-sm font-semibold text-white">{album.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {album.mainArtists.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onSkipHint}
          disabled={disabled}
          className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.15] text-gray-400 hover:text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="Skip and reveal next hint"
        >
          Skip
        </button>

        <button
          type="submit"
          disabled={disabled || !guess.trim()}
          className="px-5 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#1DB954]/20 flex-shrink-0"
        >
          Guess
        </button>
      </div>
    </form>
  );
}
