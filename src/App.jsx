import { useState } from 'react';
import { Login } from './components/Login';
import { Disc } from './components/Disc';
import { Home } from './components/Home';
import { Game } from './components/Game';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useSpotifyAPI, clearAlbumCache } from './hooks/useSpotifyAPI';

function SpinningDisc({ label, sublabel }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Disc className="w-32 h-32" />
        </div>
        <p className="text-lg font-semibold text-ink">{label}</p>
        {sublabel && <p className="text-sm text-ink-soft mt-1">{sublabel}</p>}
      </div>
    </div>
  );
}

function App() {
  const { accessToken, isAuthenticated, isLoading: authLoading, error: authError, login, logout } = useSpotifyAuth();
  const { albums, isLoading: albumsLoading, error: albumsError } = useSpotifyAPI(accessToken);

  // null = on the home screen; { mode, goal, ultraHard } = in a game
  // mode is the reveal style ('blur' | 'tile'); goal is the gauntlet target streak (null = endless);
  // ultraHard hides artist names from the guess autocomplete
  const [session, setSession] = useState(null);

  const handleLogout = () => {
    clearAlbumCache();
    setSession(null);
    logout();
  };

  // Show loading state during authentication
  if (authLoading) {
    return <SpinningDisc label="Loading…" />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={login} error={authError} />;
  }

  // Show error state (only set when there's no cached library to fall back on)
  if (albumsError) {
    console.error('Album fetch error:', albumsError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <div className="max-w-md text-center">
          <h2 className="font-display font-black text-3xl text-ink mb-3">Something went wrong</h2>
          <p className="text-ink-soft text-sm mb-6">{albumsError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent hover:bg-accent-deep text-cream font-bold rounded-full transition-all"
            >
              Try again
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-cream border border-ink/15 hover:border-ink/35 text-ink font-bold rounded-full transition-all"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Home screen renders immediately — the library loads in the background
  if (session === null) {
    return <Home onStart={(mode, goal, ultraHard) => setSession({ mode, goal, ultraHard })} onLogout={handleLogout} />;
  }

  // Game started before the library finished loading — wait for it here
  if (albums.length === 0) {
    if (albumsLoading) {
      return <SpinningDisc label="Loading your albums…" sublabel="This may take a moment" />;
    }

    // Fallback - no albums and not loading
    return <SpinningDisc label="No albums found" sublabel="Like some songs on Spotify first" />;
  }

  return (
    <Game
      albums={albums}
      mode={session.mode}
      goal={session.goal}
      ultraHard={session.ultraHard}
      onHome={() => setSession(null)}
    />
  );
}

export default App;
