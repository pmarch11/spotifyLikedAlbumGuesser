// Extract unique albums from liked songs
export function extractUniqueAlbums(savedTracks) {
  const albumMap = new Map();
  const strippedNameMap = new Map(); // Track albums by stripped name for deduplication

  for (const savedTrack of savedTracks) {
    const { track } = savedTrack;
    const { album } = track;

    if (!album.images || album.images.length === 0) {
      continue; // Skip albums without images
    }

    if (!albumMap.has(album.id)) {
      // Get all unique artists from all tracks in this album
      const allArtistNames = new Set();
      album.artists.forEach(artist => allArtistNames.add(artist.name));

      // Also add track artists
      track.artists.forEach(artist => allArtistNames.add(artist.name));

      const releaseYear = album.release_date.split('-')[0];

      const newAlbum = {
        id: album.id,
        name: stripEditionInfo(album.name), // Strip edition info from displayed name
        imageUrl: album.images[0].url,
        releaseYear,
        totalTracks: album.total_tracks,
        mainArtists: album.artists.map((a) => a.name),
        allArtists: Array.from(allArtistNames),
        trackTitles: [track.name],
        trackIds: [track.id],
        previewUrl: track.preview_url ?? null,
        uri: album.uri,
      };

      albumMap.set(album.id, newAlbum);

      // Check for duplicates by stripped name
      const strippedName = stripEditionInfo(album.name).toLowerCase();
      if (strippedNameMap.has(strippedName)) {
        const existingAlbumId = strippedNameMap.get(strippedName);
        const existingAlbum = albumMap.get(existingAlbumId);
        // Keep the one with more liked tracks (will be determined at the end)
        strippedNameMap.set(strippedName, album.id);
      } else {
        strippedNameMap.set(strippedName, album.id);
      }
    } else {
      // If album already exists, add any new artists and track titles from this track
      const existingAlbum = albumMap.get(album.id);
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

  // Deduplicate by stripped name - group albums with same stripped name
  const strippedGroups = new Map();
  for (const album of albumMap.values()) {
    const strippedName = stripEditionInfo(album.name).toLowerCase();
    if (!strippedGroups.has(strippedName)) {
      strippedGroups.set(strippedName, []);
    }
    strippedGroups.get(strippedName).push(album);
  }

  // For each group, keep only the album with the most liked tracks
  const deduplicatedAlbums = [];
  for (const group of strippedGroups.values()) {
    if (group.length === 1) {
      deduplicatedAlbums.push(group[0]);
    } else {
      // Keep the one with most liked tracks
      const bestAlbum = group.reduce((best, current) =>
        current.trackTitles.length > best.trackTitles.length ? current : best
      );
      deduplicatedAlbums.push(bestAlbum);
    }
  }

  return deduplicatedAlbums;
}

// Build album list from saved albums (GET /me/albums)
export function extractAlbumsFromSaved(savedAlbums) {
  const albums = savedAlbums
    .filter(({ album }) => album.images && album.images.length > 0)
    .map(({ album }) => {
      const releaseYear = album.release_date.split('-')[0];

      // Collect all unique artists across every track (for featured artist detection)
      const allArtistNames = new Set(album.artists.map(a => a.name));
      album.tracks.items.forEach(track =>
        track.artists.forEach(a => allArtistNames.add(a.name))
      );

      const previewUrl = album.tracks.items.find(t => t.preview_url)?.preview_url ?? null;

      return {
        id: album.id,
        name: stripEditionInfo(album.name), // Strip edition info from displayed name
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

  // Deduplicate by stripped name - group albums with same stripped name
  const strippedGroups = new Map();
  for (const album of albums) {
    const strippedName = stripEditionInfo(album.name).toLowerCase();
    if (!strippedGroups.has(strippedName)) {
      strippedGroups.set(strippedName, []);
    }
    strippedGroups.get(strippedName).push(album);
  }

  // For each group, keep only the album with the most tracks (saved albums have all tracks)
  const deduplicatedAlbums = [];
  for (const group of strippedGroups.values()) {
    if (group.length === 1) {
      deduplicatedAlbums.push(group[0]);
    } else {
      // Keep the one with most tracks
      const bestAlbum = group.reduce((best, current) =>
        current.trackTitles.length > best.trackTitles.length ? current : best
      );
      deduplicatedAlbums.push(bestAlbum);
    }
  }

  return deduplicatedAlbums;
}

// Select random album, weighted by number of saved tracks
export function selectRandomAlbum(albums) {
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

// Strip edition information from album name
export function stripEditionInfo(albumName) {
  const editionKeywords = 'Deluxe|Expanded|Remastered?|Re-?Mastered?|Reissue|Live|Anniversary|Special|Bonus Track|Explicit|Clean|Radio Edit|Single Version|Album Version|Extended|Collector\'s|Edition|Version';

  return albumName
    // Remove anything in parentheses or brackets containing edition keywords
    // This handles: (Deluxe), [Remastered], (Expanded & Remastered), (Reissue - Deluxe Edition), etc.
    .replace(new RegExp(`\\s*[\\(\\[][^()\\[\\]]*?(${editionKeywords})[^()\\[\\]]*?[\\)\\]]\\s*`, 'gi'), '')
    // Clean up any resulting double spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize string for comparison
export function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    // Remove accents/diacritics (ö -> o, ü -> u, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Fuzzy match search term against target string
// Returns true if search term approximately matches target
export function fuzzyMatch(searchTerm, target) {
  const normalizedSearch = normalizeString(searchTerm);
  const normalizedTarget = normalizeString(target);

  // Exact substring match
  if (normalizedTarget.includes(normalizedSearch)) {
    return true;
  }

  // Split search into words and check if all words appear in target
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 0);

  // All search words must appear as substrings in the target
  return searchWords.every(word => normalizedTarget.includes(word));
}

// Check if guess matches album name
export function checkGuess(guess, albumName) {
  // Strip edition info from both before normalizing
  const strippedAlbum = stripEditionInfo(albumName);
  const normalizedAlbum = normalizeString(strippedAlbum);

  // Check if guess is in "Artist - Album" format
  let guessToCheck = guess;
  if (guess.includes(' - ')) {
    // Extract just the album part (everything after " - ")
    const parts = guess.split(' - ');
    if (parts.length > 1) {
      guessToCheck = parts.slice(1).join(' - '); // Handle album names that also contain " - "
    }
  }

  const strippedGuess = stripEditionInfo(guessToCheck);
  const normalizedGuess = normalizeString(strippedGuess);
  return normalizedGuess === normalizedAlbum;
}

// Get featured/collaborating artists (excluding main album artists)
export function getFeaturedArtists(album) {
  const mainArtistNames = new Set(album.mainArtists);
  return album.allArtists.filter(artist => !mainArtistNames.has(artist));
}

// Generate hints based on guess number
export function generateHints(album, guessNumber) {
  const hints = [];

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
export function calculateBlurLevel(guessNumber) {
  const blurLevels = [40, 30, 20, 12, 5, 0]; // Index 0 is initial, 1-5 are after each guess
  return blurLevels[Math.min(guessNumber, blurLevels.length - 1)];
}

// Find matching album from user's library based on guess
export function findMatchingAlbum(guess, albums) {
  // Extract just the album part if guess is in "Artist - Album" format
  let guessToCheck = guess;
  if (guess.includes(' - ')) {
    const parts = guess.split(' - ');
    if (parts.length > 1) {
      guessToCheck = parts.slice(1).join(' - '); // Handle album names that also contain " - "
    }
  }

  const strippedGuess = stripEditionInfo(guessToCheck);
  const normalizedGuess = normalizeString(strippedGuess);

  for (const album of albums) {
    const strippedAlbumName = stripEditionInfo(album.name);
    const normalizedAlbumName = normalizeString(strippedAlbumName);
    if (normalizedGuess === normalizedAlbumName) {
      return album;
    }
  }

  return null;
}

// Check if the guessed album has any matching artists with the target album
export function hasMatchingArtist(guessedAlbum, targetAlbum) {
  const targetArtistNames = new Set(targetAlbum.mainArtists.map(a => normalizeString(a)));

  return guessedAlbum.mainArtists.some(artist =>
    targetArtistNames.has(normalizeString(artist))
  );
}
