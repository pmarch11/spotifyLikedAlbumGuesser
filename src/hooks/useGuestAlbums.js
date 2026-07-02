import { useState, useEffect } from 'react';
import { fetchGuestPoolAlbums } from '../utils/itunes';

const CACHE_PREFIX = 'guest_pool_cache_';
// Catalog decks barely change, and a refetch is ~12 requests against iTunes'
// ~20/min limit, so cache generously
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readPoolCache(poolId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + poolId);
    if (!raw) return null;
    const { timestamp, albums } = JSON.parse(raw);
    if (!Array.isArray(albums) || albums.length === 0) return null;
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return albums;
  } catch {
    return null;
  }
}

function writePoolCache(poolId, albums) {
  try {
    localStorage.setItem(CACHE_PREFIX + poolId, JSON.stringify({ timestamp: Date.now(), albums }));
  } catch (err) {
    console.warn('Failed to cache guest pool:', err);
  }
}

// Album source for guest mode: a curated deck from the iTunes Search API
// instead of the player's Spotify library. Pass null when not in guest mode.
export function useGuestAlbums(poolId) {
  const [albums, setAlbums] = useState(() => (poolId ? readPoolCache(poolId) ?? [] : []));
  const [error, setError] = useState(null);
  const [prevPool, setPrevPool] = useState(poolId);

  // Reset during render (not in an effect) when the deck changes
  if (prevPool !== poolId) {
    setPrevPool(poolId);
    setAlbums(poolId ? readPoolCache(poolId) ?? [] : []);
    setError(null);
  }

  const isLoading = !!poolId && albums.length === 0 && !error;

  useEffect(() => {
    if (!poolId) return;
    if (readPoolCache(poolId) !== null) return; // deck already cached

    let cancelled = false;

    fetchGuestPoolAlbums(poolId)
      .then((fresh) => {
        if (cancelled) return;
        if (fresh.length === 0) {
          setError("Couldn't load this deck. Please try again in a minute.");
          return;
        }
        writePoolCache(poolId, fresh);
        setAlbums(fresh);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Couldn't load this deck — check your connection and try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [poolId]);

  return { albums, isLoading, error };
}
