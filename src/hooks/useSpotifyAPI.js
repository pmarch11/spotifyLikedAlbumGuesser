import { useState, useEffect } from 'react';
import { fetchAllLikedSongs } from '../utils/spotify';
import { extractUniqueAlbums } from '../utils/gameLogic';

const CACHE_KEY = 'spotify_album_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function clearAlbumCache() {
  localStorage.removeItem(CACHE_KEY);
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, albums } = JSON.parse(raw);
    if (!Array.isArray(albums) || albums.length === 0) return null;
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return albums;
  } catch {
    return null;
  }
}

function writeCache(albums) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), albums }));
  } catch (err) {
    // localStorage may be full or unavailable; the cache is only an optimization
    console.warn('Failed to cache albums:', err);
  }
}

export function useSpotifyAPI(accessToken) {
  const [albums, setAlbums] = useState(() => (accessToken ? readCache() ?? [] : []));
  const [error, setError] = useState(null);
  const [prevToken, setPrevToken] = useState(accessToken);

  // Reset per-token state during render (not in an effect) when the token changes,
  // e.g. on logout or when a different account logs in
  if (prevToken !== accessToken) {
    setPrevToken(accessToken);
    setAlbums(accessToken ? readCache() ?? [] : []);
    setError(null);
  }

  // Loading = authenticated but nothing to play yet (no cache, fetch still in flight)
  const isLoading = !!accessToken && albums.length === 0 && !error;

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const fetchFresh = async () => {
      const savedTracks = await fetchAllLikedSongs(accessToken);

      if (savedTracks.length === 0) {
        const err = new Error('No liked songs found. Please like some songs on Spotify first!');
        err.isUserMessage = true;
        throw err;
      }

      const uniqueAlbums = extractUniqueAlbums(savedTracks);

      if (uniqueAlbums.length === 0) {
        const err = new Error('No albums with cover images found in your liked songs.');
        err.isUserMessage = true;
        throw err;
      }

      return uniqueAlbums;
    };

    // With a valid cache, this session plays from it and the fetch only rewrites
    // the cache in the background — next session picks up new likes and (for large
    // libraries) a fresh random sample. State is never swapped mid-session, which
    // would change the album pool and autocomplete during an active game.
    const hasCache = readCache() !== null;

    fetchFresh()
      .then((fresh) => {
        if (cancelled) return;
        writeCache(fresh);
        if (!hasCache) setAlbums(fresh);
      })
      .catch((err) => {
        if (cancelled) return;
        if (hasCache) {
          console.warn('Background album refresh failed:', err);
          return;
        }
        if (err instanceof Error) {
          if (err.isUserMessage) {
            setError(err.message);
          } else if (err.message === 'Token expired') {
            setError('Session expired. Please log in again.');
          } else {
            setError(`Failed to fetch albums: ${err.message}`);
          }
        } else {
          setError('Failed to fetch albums. Please try again.');
        }
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return {
    albums,
    isLoading,
    error,
  };
}
