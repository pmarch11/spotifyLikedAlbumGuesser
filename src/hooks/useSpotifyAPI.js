import { useState, useEffect } from 'react';
import { fetchAllLikedSongs } from '../utils/spotify';
import { extractUniqueAlbums } from '../utils/gameLogic';

const CACHE_KEY = 'spotify_album_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// After a 429, don't hit the API again for this long — retrying while limited
// can extend the penalty. Spotify hides Retry-After from browsers, so when the
// real wait is unknown this is our own conservative guess.
const RATE_LIMIT_KEY = 'spotify_rate_limited_until';
const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;

function readRateLimitedUntil() {
  try {
    const until = parseInt(sessionStorage.getItem(RATE_LIMIT_KEY), 10);
    if (!Number.isFinite(until)) return null;
    if (Date.now() >= until) {
      sessionStorage.removeItem(RATE_LIMIT_KEY);
      return null;
    }
    return until;
  } catch {
    return null;
  }
}

function writeRateLimitCooldown(retryAfterSeconds) {
  const waitMs = Math.max((retryAfterSeconds ?? 0) * 1000, RATE_LIMIT_COOLDOWN_MS);
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, String(Date.now() + waitMs));
  } catch {
    // best effort; worst case we just retry sooner
  }
}

export function clearAlbumCache() {
  localStorage.removeItem(CACHE_KEY);
}

// Pool of cover URLs for the CD label art. Kept in its own key that is
// deliberately NOT cleared on logout — the album cache is wiped right before
// the login screen mounts, and the loading screens only appear when the cache
// is empty, so the CD would otherwise never have art to show.
const ART_POOL_KEY = 'disc_art_pool';
const ART_POOL_SIZE = 60;

function writeArtPool(albums) {
  try {
    const urls = albums.map((a) => a.images?.[0]?.url).filter(Boolean);
    for (let i = urls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [urls[i], urls[j]] = [urls[j], urls[i]];
    }
    localStorage.setItem(ART_POOL_KEY, JSON.stringify(urls.slice(0, ART_POOL_SIZE)));
  } catch {
    // best effort; the label art is only decoration
  }
}

// Random cover for the CD label side. Prefers the live album cache, falls back
// to the persistent pool; null when neither exists yet (pristine first visit).
export function getRandomCachedAlbumArtUrl() {
  const albums = readCache();
  if (albums) {
    if (!localStorage.getItem(ART_POOL_KEY)) writeArtPool(albums);
    const url = albums[Math.floor(Math.random() * albums.length)]?.images?.[0]?.url;
    if (url) return url;
  }
  try {
    const pool = JSON.parse(localStorage.getItem(ART_POOL_KEY));
    if (Array.isArray(pool) && pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  } catch {
    // fall through
  }
  return null;
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
  writeArtPool(albums);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), albums }));
  } catch (err) {
    // localStorage may be full or unavailable; the cache is only an optimization
    console.warn('Failed to cache albums:', err);
  }
}

// Error to show on mount when we're inside a rate-limit cooldown and have no
// cache to play from (with a cache the game works and we just skip the refresh)
function rateLimitCooldownError(accessToken) {
  if (!accessToken) return null;
  const limitedUntil = readRateLimitedUntil();
  if (limitedUntil === null || readCache() !== null) return null;
  const minutesLeft = Math.max(1, Math.ceil((limitedUntil - Date.now()) / 60000));
  return `Rate limited by Spotify. Holding off for about ${minutesLeft} minute(s) before trying again — reload the page after that.`;
}

export function useSpotifyAPI(accessToken) {
  const [albums, setAlbums] = useState(() => (accessToken ? readCache() ?? [] : []));
  const [error, setError] = useState(() => rateLimitCooldownError(accessToken));
  const [prevToken, setPrevToken] = useState(accessToken);

  // Reset per-token state during render (not in an effect) when the token changes,
  // e.g. on logout or when a different account logs in
  if (prevToken !== accessToken) {
    setPrevToken(accessToken);
    setAlbums(accessToken ? readCache() ?? [] : []);
    setError(rateLimitCooldownError(accessToken));
  }

  // Loading = authenticated but nothing to play yet (no cache, fetch still in flight)
  const isLoading = !!accessToken && albums.length === 0 && !error;

  useEffect(() => {
    if (!accessToken) return;

    // Recently rate-limited: skip the fetch entirely so a reload doesn't keep
    // hammering the API and extending the penalty. The user-facing message is
    // set at state-init time by rateLimitCooldownError.
    if (readRateLimitedUntil() !== null) return;

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
        // Record the cooldown even if unmounted/cancelled — it's global state
        // that protects the next mount from re-hitting a limited API
        if (err?.isRateLimit) writeRateLimitCooldown(err.retryAfterSeconds);
        if (cancelled) return;
        if (hasCache) {
          console.warn('Background album refresh failed:', err);
          return;
        }
        if (err instanceof Error) {
          if (err.isUserMessage || err.isRateLimit) {
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
