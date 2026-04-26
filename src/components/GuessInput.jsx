import { useState, useRef, useEffect } from 'react';
import { fuzzyMatch } from '../utils/gameLogic';

export function GuessInput({ onGuess, onSkipHint, disabled, allAlbums, currentAlbumId: _currentAlbumId }) {
  const [guess, setGuess] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const justClosedRef = useRef(false);

  // Filter suggestions based on input
  const suggestions = guess.length >= 2
    ? allAlbums
        .filter(album => {
          // Check if search matches album name or artist names
          const albumName = album.name;
          const artistNames = album.mainArtists.join(' ');
          return fuzzyMatch(guess, albumName) || fuzzyMatch(guess, artistNames);
        })
        .slice(0, 8)
    : [];

  useEffect(() => {
    // Don't reopen if it was just manually closed
    if (justClosedRef.current) {
      justClosedRef.current = false;
      return;
    }
    setShowSuggestions(suggestions.length > 0 && guess.length >= 2);
    setSelectedIndex(0);
  }, [guess, suggestions.length]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        justClosedRef.current = true;
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guess.trim()) {
      onGuess(guess.trim());
      setGuess('');
      justClosedRef.current = false; // Reset for next input
      setShowSuggestions(false);
    } else {
      // If no input, act as skip
      onSkipHint();
    }
  };

  const handleInputChange = (e) => {
    justClosedRef.current = false; // Allow dropdown to reopen when typing
    setGuess(e.target.value);
  };

  const handleSuggestionClick = (album) => {
    justClosedRef.current = true;
    const formattedGuess = `${album.mainArtists.join(', ')} - ${album.name}`;
    setGuess(formattedGuess);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      justClosedRef.current = true;
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
            onChange={handleInputChange}
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
                  onClick={() => handleSuggestionClick(album)}
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
          type="submit"
          disabled={disabled}
          className="px-5 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#1DB954]/20 flex-shrink-0"
        >
          {guess.trim() ? 'Guess' : 'Skip'}
        </button>
      </div>
    </form>
  );
}
