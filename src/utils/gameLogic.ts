import type { GameAlbum, SpotifySavedTrack, SpotifySavedAlbum, Hint } from '../types/spotify';

// Extract unique albums from liked songs
export function extractUniqueAlbums(savedTracks: SpotifySavedTrack[]): GameAlbum[] {
  const albumMap = new Map<string, GameAlbum>();

  for (const savedTrack of savedTracks) {
    const { track } = savedTrack;
    const { album } = track;

    if (!album.images || album.images.length === 0) {
      continue; // Skip albums without images
    }

    if (!albumMap.has(album.id)) {
      // Get all unique artists from all tracks in this album
      const allArtistNames = new Set<string>();
      album.artists.forEach(artist => allArtistNames.add(artist.name));

      // Also add track artists
      track.artists.forEach(artist => allArtistNames.add(artist.name));

      const releaseYear = album.release_date.split('-')[0];

      albumMap.set(album.id, {
        id: album.id,
        name: album.name,
        imageUrl: album.images[0].url,
        releaseYear,
        totalTracks: album.total_tracks,
        mainArtists: album.artists.map((a: { name: string }) => a.name),
        allArtists: Array.from(allArtistNames),
        trackTitles: [track.name],
        trackIds: [track.id],
        previewUrl: track.preview_url ?? null,
        uri: album.uri,
      });
    } else {
      // If album already exists, add any new artists and track titles from this track
      const existingAlbum = albumMap.get(album.id)!;
      track.artists.forEach(artist => {
        if (!existingAlbum.allArtists.includes(artist.name)) {
          existingAlbum.allArtists.push(artist.name);
        }
      });
      if (!existingAlbum.trackTitles.includes(track.name)) {
        existingAlbum.trackTitles.push(track.name);
        existingAlbum.trackIds.push(track.id);
      }
      if (!existingAlbum.previewUrl && track.preview_url) {
        existingAlbum.previewUrl = track.preview_url;
      }
    }
  }

  return Array.from(albumMap.values());
}

// Build album list from saved albums (GET /me/albums)
export function extractAlbumsFromSaved(savedAlbums: SpotifySavedAlbum[]): GameAlbum[] {
  return savedAlbums
    .filter(({ album }) => album.images && album.images.length > 0)
    .map(({ album }) => {
      const releaseYear = album.release_date.split('-')[0];

      // Collect all unique artists across every track (for featured artist detection)
      const allArtistNames = new Set<string>(album.artists.map(a => a.name));
      album.tracks.items.forEach(track =>
        track.artists.forEach(a => allArtistNames.add(a.name))
      );

      const previewUrl = album.tracks.items.find(t => t.preview_url)?.preview_url ?? null;

      return {
        id: album.id,
        name: album.name,
        imageUrl: album.images[0].url,
        releaseYear,
        totalTracks: album.total_tracks,
        mainArtists: album.artists.map(a => a.name),
        allArtists: Array.from(allArtistNames),
        trackTitles: album.tracks.items.map(t => t.name),
        trackIds: album.tracks.items.map(t => t.id),
        previewUrl,
        uri: album.uri,
      };
    });
}

// Select random album, weighted by number of saved tracks
export function selectRandomAlbum(albums: GameAlbum[]): GameAlbum | null {
  if (albums.length === 0) return null;
  const weights = albums.map(album => album.trackTitles.length);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < albums.length; i++) {
    random -= weights[i];
    if (random <= 0) return albums[i];
  }
  return albums[albums.length - 1];
}

// Normalize string for comparison
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Check if guess matches album name
export function checkGuess(guess: string, albumName: string): boolean {
  const normalizedGuess = normalizeString(guess);
  const normalizedAlbum = normalizeString(albumName);

  return normalizedGuess === normalizedAlbum;
}

// Get featured/collaborating artists (excluding main album artists)
export function getFeaturedArtists(album: GameAlbum): string[] {
  const mainArtistNames = new Set(album.mainArtists);
  return album.allArtists.filter(artist => !mainArtistNames.has(artist));
}

// Generate hints based on guess number
export function generateHints(album: GameAlbum, guessNumber: number): Hint[] {
  const hints: Hint[] = [];

  // Hint 1: Release year + track count combined
  if (guessNumber >= 1) {
    hints.push({
      type: 'year',
      value: album.releaseYear,
      label: `Released in ${album.releaseYear} · ${album.totalTracks} tracks`,
    });
  }

  // Hint 2: Featured artists
  if (guessNumber >= 2) {
    const featuredArtists = getFeaturedArtists(album);
    const artistsText = featuredArtists.length > 0 ? featuredArtists.join(', ') : 'None';
    hints.push({
      type: 'artists',
      value: artistsText,
      label: `Featured artists: ${artistsText}`,
    });
  }

  // Hint 3: First letter + word count + letter count
  if (guessNumber >= 3) {
    const firstLetter = album.name.charAt(0).toUpperCase();
    const wordCount = album.name.trim().split(/\s+/).length;
    const letterCount = album.name.replace(/\s/g, '').length;
    hints.push({
      type: 'firstLetter',
      value: firstLetter,
      label: `Starts with "${firstLetter}" · ${wordCount} ${wordCount === 1 ? 'word' : 'words'} · ${letterCount} ${letterCount === 1 ? 'letter' : 'letters'}`,
    });
  }

  // Hint 4: Up to 3 liked track titles from this album
  if (guessNumber >= 4) {
    const titles = album.trackTitles.slice(0, 3);
    hints.push({
      type: 'trackCount',
      value: titles.join(', '),
      label: `Songs: ${titles.join(', ')}`,
    });
  }

  return hints;
}

// Calculate blur level based on guess number
export function calculateBlurLevel(guessNumber: number): number {
  const blurLevels = [40, 30, 20, 12, 5, 0]; // Index 0 is initial, 1-5 are after each guess
  return blurLevels[Math.min(guessNumber, blurLevels.length - 1)];
}

// Find matching album from user's library based on guess
export function findMatchingAlbum(guess: string, albums: GameAlbum[]): GameAlbum | null {
  const normalizedGuess = normalizeString(guess);

  for (const album of albums) {
    const normalizedAlbumName = normalizeString(album.name);
    if (normalizedGuess === normalizedAlbumName) {
      return album;
    }
  }

  return null;
}

// Check if the guessed album has any matching artists with the target album
export function hasMatchingArtist(guessedAlbum: GameAlbum, targetAlbum: GameAlbum): boolean {
  const targetArtistNames = new Set(targetAlbum.mainArtists.map(a => normalizeString(a)));

  return guessedAlbum.mainArtists.some(artist =>
    targetArtistNames.has(normalizeString(artist))
  );
}
