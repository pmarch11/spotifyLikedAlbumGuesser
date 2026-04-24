import { useState, useEffect } from 'react';
import {
  generateRandomString,
  generateCodeChallenge,
  getAuthUrl,
  exchangeCodeForToken,
} from '../utils/spotify';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://127.0.0.1:8080/callback';

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = sessionStorage.getItem('spotify_access_token');
    const tokenExpiry = sessionStorage.getItem('spotify_token_expiry');

    if (token && tokenExpiry) {
      const now = Date.now();
      if (now < parseInt(tokenExpiry, 10)) {
        setAccessToken(token);
      } else {
        // Token expired, clear it
        sessionStorage.removeItem('spotify_access_token');
        sessionStorage.removeItem('spotify_token_expiry');
      }
    }

    setIsLoading(false);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const storedVerifier = sessionStorage.getItem('code_verifier');

      if (code && storedVerifier) {
        try {
          setIsLoading(true);
          const response = await exchangeCodeForToken(code, storedVerifier, CLIENT_ID, REDIRECT_URI);

          const expiryTime = Date.now() + response.expires_in * 1000;
          sessionStorage.setItem('spotify_access_token', response.access_token);
          sessionStorage.setItem('spotify_token_expiry', expiryTime.toString());
          sessionStorage.removeItem('code_verifier');

          setAccessToken(response.access_token);

          // Clean up URL
          window.history.replaceState({}, document.title, '/');
        } catch (err) {
          setError('Failed to authenticate with Spotify');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, []);

  // Initiate login flow
  const login = async () => {
    try {
      if (!CLIENT_ID) {
        setError('Spotify Client ID is not configured');
        return;
      }

      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem('code_verifier', codeVerifier);

      const authUrl = getAuthUrl(CLIENT_ID, REDIRECT_URI, codeChallenge);
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate login');
      console.error(err);
    }
  };

  // Logout
  const logout = () => {
    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_token_expiry');
    setAccessToken(null);
    setError(null);
  };

  return {
    accessToken,
    isAuthenticated: !!accessToken,
    isLoading,
    error,
    login,
    logout,
  };
}
