// Spotify API helper functions

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Generate a random string for PKCE
export function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Generate code challenge from verifier
export async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Build Spotify authorization URL
export function getAuthUrl(clientId, redirectUri, codeChallenge) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: 'user-library-read',
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  code,
  codeVerifier,
  clientId,
  redirectUri
) {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

// Fetch user's liked songs with pagination (retries on 429)
export async function fetchLikedSongs(
  accessToken,
  limit = 50,
  offset = 0,
  retries = 3
) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`https://api.spotify.com/v1/me/tracks?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Token expired');
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
      if (retryAfter > 10) {
        throw new Error(`Rate limited by Spotify. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before trying again.`);
      }
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return fetchLikedSongs(accessToken, limit, offset, retries - 1);
      }
    }
    throw new Error('Failed to fetch liked songs');
  }

  return response.json();
}

// Fetch all saved albums (handles pagination)
export async function fetchAllSavedAlbums(accessToken) {
  const allAlbums = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    const response = await fetch(`https://api.spotify.com/v1/me/albums?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Token expired');
      throw new Error('Failed to fetch saved albums');
    }

    const data = await response.json();
    allAlbums.push(...data.items);
    hasMore = data.next !== null;
    offset += limit;
  }

  return allAlbums;
}

// Fetch pages in small batches to avoid Spotify rate limits
async function fetchPagesBatched(
  accessToken,
  pages,
  limit,
  batchSize = 3
) {
  const results = [];
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const responses = await Promise.all(
      batch.map(page => fetchLikedSongs(accessToken, limit, page * limit))
    );
    responses.forEach(r => results.push(...r.items));
    if (i + batchSize < pages.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  return results;
}

// Fetch a random sample of up to 1000 liked songs.
// For libraries <= 1000 songs, fetches everything.
// For larger libraries, picks 20 random pages (20 × 50 = 1000 songs) in batches.
export async function fetchAllLikedSongs(accessToken) {
  const limit = 50;
  const targetPages = 20;

  const firstResponse = await fetchLikedSongs(accessToken, limit, 0);
  const total = firstResponse.total;
  const totalPages = Math.ceil(total / limit);
  const allTracks = [...firstResponse.items];

  if (totalPages <= targetPages) {
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const tracks = await fetchPagesBatched(accessToken, remaining, limit);
    allTracks.push(...tracks);
    return allTracks;
  }

  const pageSet = new Set([0]);
  while (pageSet.size < targetPages) {
    pageSet.add(Math.floor(Math.random() * totalPages));
  }

  const randomPages = Array.from(pageSet).filter(p => p !== 0);
  const tracks = await fetchPagesBatched(accessToken, randomPages, limit);
  allTracks.push(...tracks);
  return allTracks;
}
