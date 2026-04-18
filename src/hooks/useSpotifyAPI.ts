import { useState, useEffect } from 'react';
import { fetchAllLikedSongs } from '../utils/spotify';
import { extractUniqueAlbums } from '../utils/gameLogic';
import type { GameAlbum, SpotifySavedTrack } from '../types/spotify';

export function useSpotifyAPI(accessToken: string | null) {
  const [albums, setAlbums] = useState<GameAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setAlbums([]);
      return;
    }

    const fetchAlbums = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const savedTracks = await fetchAllLikedSongs(accessToken);

        if (savedTracks.length === 0) {
          setError('No liked songs found. Please like some songs on Spotify first!');
          setAlbums([]);
          return;
        }

        const uniqueAlbums = extractUniqueAlbums(savedTracks as SpotifySavedTrack[]);

        if (uniqueAlbums.length === 0) {
          setError('No albums with cover images found in your liked songs.');
          setAlbums([]);
          return;
        }

        setAlbums(uniqueAlbums);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'Token expired') {
            setError('Session expired. Please log in again.');
          } else {
            setError(`Failed to fetch albums: ${err.message}`);
          }
        } else {
          setError('Failed to fetch albums. Please try again.');
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [accessToken]);

  return {
    albums,
    isLoading,
    error,
  };
}
