import { Login } from './components/Login';
import { Game } from './components/Game';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useSpotifyAPI } from './hooks/useSpotifyAPI';

function App() {
  const { accessToken, isAuthenticated, isLoading: authLoading, error: authError, login, logout } = useSpotifyAuth();
  const { albums, isLoading: albumsLoading, error: albumsError } = useSpotifyAPI(accessToken);

  // Show loading state during authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          <p className="text-xl text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={login} error={authError} />;
  }

  // Show loading state while fetching albums
  if (albumsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          <p className="text-xl text-gray-300 mb-2">Loading your albums...</p>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (albumsError) {
    console.error('Album fetch error:', albumsError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black px-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-6">{albumsError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={logout}
              className="px-6 py-3 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show game
  if (albums.length > 0) {
    return <Game albums={albums} accessToken={accessToken} onLogout={logout} />;
  }

  // Fallback - no albums
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center">
        <p className="text-xl text-gray-300">No albums found</p>
      </div>
    </div>
  );
}

export default App;
