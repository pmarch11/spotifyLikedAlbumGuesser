# Spotify Album Guesser

A fun React-based game where you guess album names from your Spotify liked songs. The album cover starts hidden, and with each wrong guess, hints are revealed and more of the cover is shown.

## Features

- **Spotify OAuth Integration**: Secure authentication using PKCE flow
- **Two Reveal Modes**: Blur (cover sharpens with each guess) or Tile (cover revealed one tile at a time)
- **Endless & Gauntlet Modes**: Play casually or chase a streak of 3, 5, or 10 in a row
- **Ultra Hard Mode**: Autocomplete hides artist names — album titles only
- **Progressive Hints System**: Get hints after each wrong guess
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Spotify-inspired aesthetic

## How to Play

1. Log in with your Spotify account
2. Choose a reveal mode (Blur or Tile) and a game mode (Endless or Gauntlet)
3. An album from your liked songs will appear (hidden)
4. Try to guess the album name — you get 5 guesses
5. After each wrong guess, more of the cover is revealed and you get a hint:
   - **After 1st guess**: Release year and track count
   - **After 2nd guess**: Featured artists/collaborators
   - **After 3rd guess**: First letter, word count, and letter count of the album name
   - **After 4th guess**: Up to 3 of your liked songs from the album
6. You can also skip straight to the next hint (costs a guess) or skip the album entirely

### Game Modes

- **Endless**: Keep playing album after album, building a streak as you go
- **Gauntlet**: Pick a target — Beginner (3), Intermediate (5), or Expert (10) — and try to guess that many in a row. One loss resets the run.

## Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
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
cd spotifyAlbumGuesser
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

Create a `.env` file in the project root with your Spotify Client ID:

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
│   ├── Login.jsx           # Spotify login button
│   ├── Home.jsx            # Mode selection screen
│   ├── Game.jsx            # Main game component
│   ├── BlurredImage.jsx    # Album cover with blur/tile reveal
│   ├── GuessInput.jsx      # Input field with autocomplete
│   ├── HintDisplay.jsx     # Shows hints after each guess
│   └── GameOver.jsx        # End game screen
├── hooks/
│   ├── useSpotifyAuth.js   # Handle OAuth flow
│   └── useSpotifyAPI.js    # Fetch liked songs/albums
├── utils/
│   ├── spotify.js          # Spotify API helper functions
│   └── gameLogic.js        # Game state and hint logic
├── App.jsx                 # Main app component
└── main.jsx                # Entry point
```

## Game Logic

### Cover Reveal

- **Blur mode**: Starts at 40px blur, reducing to 30 → 20 → 12 → 5px with each guess, fully clear when the round ends
- **Tile mode**: The cover is split into 6 tiles; one tile is revealed with each guess

### Album Matching

The game normalizes your guess and the album name for comparison:
- Case-insensitive
- Removes punctuation
- Trims whitespace
- Strips edition info ("Deluxe", "Expanded", "Remastered", etc.) so "Abbey Road (Remastered)" matches "Abbey Road"
- Accepts "Artist - Album" format (only the album part is checked)

Duplicate editions of the same album in your library are deduplicated.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory. A `vercel.json` is included for SPA routing on Vercel.

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

Built with React and the Spotify Web API.
