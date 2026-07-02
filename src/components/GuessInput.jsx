import { useState, useRef, useEffect } from 'react';
import { fuzzyMatch } from '../utils/gameLogic';

export function GuessInput({ onGuess, onSkipHint, disabled, allAlbums, currentAlbumId: _currentAlbumId, ultraHard }) {
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
          // Check if search matches album name or artist names.
          // In ultra hard mode, artists are hidden so only match album names.
          if (fuzzyMatch(guess, album.name)) return true;
          if (ultraHard) return false;
          return fuzzyMatch(guess, album.mainArtists.join(' '));
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
    const formattedGuess = ultraHard
      ? album.name
      : `${album.mainArtists.join(', ')} - ${album.name}`;
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
      <div className="flex gap-2.5 items-center">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Name that album…"
            autoComplete="off"
            className="w-full px-4 py-3.5 bg-card border border-ink/12 rounded-2xl text-ink placeholder-ink/40 focus:outline-none focus:border-ink/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1.5 bg-card border border-ink/12 rounded-2xl shadow-[0_16px_40px_rgba(43,33,26,0.2)] max-h-64 overflow-y-auto overflow-x-hidden"
            >
              {suggestions.map((album, index) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => handleSuggestionClick(album)}
                  className={`w-full px-4 py-2.5 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent/10 border-l-2 border-accent'
                      : 'hover:bg-ink/[0.04] border-l-2 border-transparent'
                  } ${index !== suggestions.length - 1 ? 'border-b border-ink/[0.07]' : ''}`}
                >
                  <div className="text-sm font-semibold text-ink">{album.name}</div>
                  {!ultraHard && (
                    <div className="text-xs text-ink-soft mt-0.5">
                      {album.mainArtists.join(', ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled}
          title={guess.trim() ? 'Submit guess' : 'Skip this guess for a hint'}
          className="w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center bg-accent hover:bg-accent-deep text-cream rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_10px_22px_rgba(207,91,39,0.35)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}
