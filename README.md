# Spotify Album Guesser

A fun React-based game where you guess album names from your Spotify liked songs. The album cover starts heavily blurred, and with each wrong guess, hints are revealed and the image becomes clearer.

## Features

- **Spotify OAuth Integration**: Secure authentication using PKCE flow
- **Progressive Hints System**: Get hints after each wrong guess
- **Dynamic Blur Effect**: Album cover becomes clearer as you guess
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Spotify-inspired aesthetic

## How to Play

1. Log in with your Spotify account
2. An album from your liked songs will appear (heavily blurred)
3. Try to guess the album name
4. After each wrong guess, you'll receive hints:
   - **After 1st guess**: Release year
   - **After 2nd guess**: Featured artists/collaborators + reduced blur
   - **After 3rd guess**: First letter of album name + more reduced blur
   - **After 4th guess**: Number of tracks + minimal blur
   - **After 5th guess**: Game over (win or lose)
5. Click "Play Again" to try a new album!

## Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Spotify Web API** - Music data

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Spotify account
- A Spotify Developer account (free)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd spotify-album-guesser
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in the app details:
   - **App name**: Spotify Album Guesser (or any name you prefer)
   - **App description**: A game to guess album names
   - **Redirect URI**: `http://localhost:8080/callback`
   - **APIs used**: Web API
5. Click "Save"
6. Copy your **Client ID** from the app settings

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Spotify Client ID:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   VITE_REDIRECT_URI=http://localhost:8080/callback
   ```

### 5. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:8080`

## Project Structure

```
src/
├── components/
│   ├── Login.tsx          # Spotify login button
│   ├── Game.tsx            # Main game component
│   ├── BlurredImage.tsx    # Album cover with blur effect
│   ├── GuessInput.tsx      # Input field for guesses
│   ├── HintDisplay.tsx     # Shows hints after each guess
│   └── GameOver.tsx        # End game screen
├── hooks/
│   ├── useSpotifyAuth.ts   # Handle OAuth flow
│   └── useSpotifyAPI.ts    # Fetch liked songs/albums
├── utils/
│   ├── spotify.ts          # Spotify API helper functions
│   └── gameLogic.ts        # Game state and hint logic
├── types/
│   └── spotify.ts          # TypeScript interfaces
├── App.tsx                 # Main app component
└── main.tsx               # Entry point
```

## Game Logic

### Blur Levels

- **Initial**: 40px blur
- **After 2nd guess**: 25px blur
- **After 3rd guess**: 15px blur
- **After 4th guess**: 5px blur
- **After 5th guess or correct**: 0px blur (fully clear)

### Hint System

Hints are revealed progressively to help you guess:

1. **Release Year**: The year the album was released
2. **Featured Artists**: Artists who appear on the album but aren't the main artist
3. **First Letter**: The first letter of the album name
4. **Track Count**: The total number of tracks on the album

### Album Matching

The game normalizes your guess and the album name for comparison:
- Case-insensitive
- Removes punctuation
- Trims whitespace

This means "Abbey Road" will match "abbey road", "Abbey Rd", etc.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### "No liked songs found"

Make sure you have liked songs in your Spotify account. Go to Spotify and like some albums or songs.

### "Failed to authenticate with Spotify"

1. Check that your Client ID is correct in `.env`
2. Verify the redirect URI in your Spotify app settings matches `http://localhost:8080/callback`
3. Try clearing your browser cache and session storage

### "Token expired"

Click the logout button and log in again. Access tokens expire after 1 hour.

## License

MIT

## Credits

Built with React, TypeScript, and the Spotify Web API.
