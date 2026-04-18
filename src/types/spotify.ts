// Spotify API response types
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
  artists: SpotifyArtist[];
  uri: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  uri: string;
  preview_url: string | null;
}

export interface SpotifySavedTrack {
  added_at: string;
  track: SpotifyTrack;
}

export interface SpotifyPaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyAlbumTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  uri: string;
  preview_url: string | null;
}

export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbum & {
    tracks: {
      items: SpotifyAlbumTrack[];
      total: number;
      next: string | null;
    };
  };
}

// Game types
export interface GameAlbum {
  id: string;
  name: string;
  imageUrl: string;
  releaseYear: string;
  totalTracks: number;
  mainArtists: string[];
  allArtists: string[];
  trackTitles: string[];
  trackIds: string[];
  previewUrl: string | null;
  uri: string;
}

export interface Hint {
  type: 'year' | 'artists' | 'firstLetter' | 'trackCount' | 'preview';
  value: string | number;
  label: string;
}

export type GameMode = 'blur' | 'tile';

export interface GameState {
  currentAlbum: GameAlbum | null;
  guesses: string[];
  hintsRevealed: Hint[];
  blurLevel: number;
  tileOrder: number[];
  gameStatus: 'playing' | 'won' | 'lost';
  maxGuesses: number;
}
