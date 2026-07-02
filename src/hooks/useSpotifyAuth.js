import { useState, useEffect } from 'react';
import {
  generateRandomString,
  generateCodeChallenge,
  getAuthUrl,
  exchangeCodeForToken,
} from '../utils/spotify';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

// Automatically determine redirect URI based on environment
const getRedirectUri = () => {
  if (import.meta.env.VITE_REDIRECT_URI) {
    return import.meta.env.VITE_REDIRECT_URI;
  }
  // Auto-detect based on current hostname
  const origin = window.location.origin;
  return `${origin}/callback`;
};

const REDIRECT_URI = getRedirectUri();

// sessionStorage doesn't carry across localhost <-> 127.0.0.1, so the PKCE
// verifier saved before login is lost if the app is opened on the other host.
// Normalize loopback hosts to match the redirect URI before anything else runs.
const normalizeLoopbackHost = () => {
  const redirectHost = new URL(REDIRECT_URI).hostname;
  const currentHost = window.location.hostname;
  const loopbackHosts = ['localhost', '127.0.0.1'];

  if (
    currentHost !== redirectHost &&
    loopbackHosts.includes(currentHost) &&
    loopbackHosts.includes(redirectHost)
  ) {
    const url = new URL(window.location.href);
    url.hostname = redirectHost;
    window.location.replace(url.toString());
    return true;
  }
  return false;
};

const isRedirecting = normalizeLoopbackHost();

// Read a still-valid stored token, clearing it if expired
const readStoredToken = () => {
  const token = sessionStorage.getItem('spotify_access_token');
  const tokenExpiry = sessionStorage.getItem('spotify_token_expiry');

  if (token && tokenExpiry) {
    if (Date.now() < parseInt(tokenExpiry, 10)) {
      return token;
    }
    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_token_expiry');
  }

  return null;
};

export function useSpotifyAuth() {
  const [accessToken, setAccessToken] = useState(readStoredToken);
  const [isLoading, setIsLoading] = useState(
    () => new URLSearchParams(window.location.search).has('code')
  );
  const [error, setError] = useState(null);

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
      } else if (code) {
        // Code came back but the PKCE verifier is gone (e.g. login was
        // started on a different origin) — restart the flow instead of hanging
        setError('Login session expired or was started on a different address. Please log in again.');
        setIsLoading(false);
        window.history.replaceState({}, document.title, '/');
      }
    };

    if (!isRedirecting) {
      handleCallback();
    }
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
