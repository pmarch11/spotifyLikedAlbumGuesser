import { stripEditionInfo, normalizeString } from './gameLogic';

// Curated guest decks. Each deck is a list of artists whose discographies are
// pulled from the iTunes Search API, which needs no account, login, or user cap —
// this is what makes the game playable by anyone without a Spotify allowlist spot.
// Artist IDs are pinned because name search is unreliable (some bands are buried
// under unrelated singles); names are for maintenance only. To add an artist:
// https://itunes.apple.com/search?term=NAME&entity=musicArtist, then sanity-check
// the id via https://itunes.apple.com/lookup?id=ID&entity=album
export const GUEST_POOLS = [
  {
    id: 'pop',
    name: 'Pop',
    artists: [
      { id: 159260351, name: 'Taylor Swift' },
      { id: 412778295, name: 'Ariana Grande' },
      { id: 1031397873, name: 'Dua Lipa' },
      { id: 1065981054, name: 'Billie Eilish' },
      { id: 479756766, name: 'The Weeknd' },
      { id: 979458609, name: 'Olivia Rodrigo' },
      { id: 471260289, name: 'Harry Styles' },
      { id: 602767352, name: 'Lorde' },
      { id: 277293880, name: 'Lady Gaga' },
      { id: 1419227, name: 'Beyoncé' },
      { id: 605800394, name: 'SZA' },
      { id: 183313439, name: 'Ed Sheeran' },
    ],
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    artists: [
      { id: 368183298, name: 'Kendrick Lamar' },
      { id: 2715720, name: 'Kanye West' },
      { id: 271256, name: 'Drake' },
      { id: 73705833, name: 'J. Cole' },
      { id: 420368335, name: 'Tyler, The Creator' },
      { id: 289550, name: 'OutKast' },
      { id: 1352449404, name: 'JAY-Z' },
      { id: 35307, name: 'Nas' },
      { id: 111051, name: 'Eminem' },
      { id: 549236696, name: 'Travis Scott' },
      { id: 1587965, name: 'A Tribe Called Quest' },
      { id: 419944559, name: 'Mac Miller' },
    ],
  },
  {
    id: 'classic-rock',
    name: 'Classic Rock',
    artists: [
      { id: 136975, name: 'The Beatles' },
      { id: 487143, name: 'Pink Floyd' },
      { id: 994656, name: 'Led Zeppelin' },
      { id: 158038, name: 'Fleetwood Mac' },
      { id: 3296287, name: 'Queen' },
      { id: 1249595, name: 'The Rolling Stones' },
      { id: 551695, name: 'David Bowie' },
      { id: 1053549, name: 'Eagles' },
      { id: 5040714, name: 'AC/DC' },
      { id: 178834, name: 'Bruce Springsteen' },
      { id: 61499, name: 'The Who' },
      { id: 54657, name: 'Elton John' },
    ],
  },
  {
    id: 'nineties',
    name: '90s',
    artists: [
      { id: 112018, name: 'Nirvana' },
      { id: 657515, name: 'Radiohead' },
      { id: 467464, name: 'Pearl Jam' },
      { id: 512633, name: 'Oasis' },
      { id: 115234, name: 'Weezer' },
      { id: 1646302, name: 'The Smashing Pumpkins' },
      { id: 889780, name: 'Red Hot Chili Peppers' },
      { id: 312095, name: 'Beck' },
      { id: 954266, name: 'Green Day' },
      { id: 1092859, name: 'Alanis Morissette' },
      { id: 311145, name: 'R.E.M.' },
      { id: 6906197, name: 'Foo Fighters' },
    ],
  },
  {
    id: 'indie',
    name: 'Indie',
    artists: [
      { id: 62820413, name: 'Arctic Monkeys' },
      { id: 290242959, name: 'Tame Impala' },
      { id: 560289, name: 'The Strokes' },
      { id: 259437105, name: 'Vampire Weekend' },
      { id: 501437762, name: 'Mac DeMarco' },
      { id: 273428126, name: 'Bon Iver' },
      { id: 275727569, name: 'Fleet Foxes' },
      { id: 697833299, name: 'Phoebe Bridgers' },
      { id: 51075707, name: 'The National' },
      { id: 4273404, name: 'Sufjan Stevens' },
      { id: 23203991, name: 'Arcade Fire' },
      { id: 442122051, name: 'Frank Ocean' },
    ],
  },
  {
    id: 'punk',
    name: 'Punk',
    artists: [
      { id: 60715, name: 'Ramones' },
      { id: 522000, name: 'The Clash' },
      { id: 3184277, name: 'Sex Pistols' },
      { id: 116250, name: 'The Misfits' },
      { id: 6904654, name: 'Dead Kennedys' },
      { id: 150160, name: 'Bad Religion' },
      { id: 2819846, name: 'NOFX' },
      { id: 1857507, name: 'Rancid' },
      { id: 2820865, name: 'The Offspring' },
      { id: 116851, name: 'blink-182' },
      { id: 2821896, name: 'Descendents' },
      { id: 4472006, name: 'Turnstile' },
    ],
  },
  {
    id: 'metal',
    name: 'Metal',
    artists: [
      { id: 165907, name: 'Black Sabbath' },
      { id: 3996865, name: 'Metallica' },
      { id: 546381, name: 'Iron Maiden' },
      { id: 154707, name: 'Judas Priest' },
      { id: 414425, name: 'Slayer' },
      { id: 488289, name: 'Megadeth' },
      { id: 155209, name: 'Pantera' },
      { id: 6907568, name: 'Slipknot' },
      { id: 462715, name: 'System of a Down' },
      { id: 140870416, name: 'TOOL' },
      { id: 65922937, name: 'Mastodon' },
      { id: 65158676, name: 'Gojira' },
    ],
  },
  {
    id: 'aussie',
    name: 'Aussie',
    artists: [
      { id: 157405, name: 'INXS' },
      { id: 463123, name: 'Silverchair' },
      { id: 407384, name: 'Powderfinger' },
      { id: 18747421, name: 'Midnight Oil' },
      { id: 490131, name: 'Crowded House' },
      { id: 4275634, name: 'Flume' },
      { id: 440629621, name: 'King Gizzard & The Lizard Wizard' },
      { id: 27524431, name: 'The Avalanches' },
      { id: 479276137, name: 'Courtney Barnett' },
      { id: 290242959, name: 'Tame Impala' },
      { id: 687934696, name: 'Gang of Youths' },
      { id: 83106206, name: 'Hilltop Hoods' },
    ],
  },
];

// Catalogs occasionally contain karaoke/tribute knock-offs and novelty
// releases; these never belong in a guessing deck
const JUNK_NAME_PATTERN =
  /karaoke|tribute|cover version|made famous|8-bit|lullaby|workout|originally performed/i;

// Look up an artist's albums by their pinned iTunes artist ID. Name-based
// search (attribute=artistTerm) is unreliable — some band names (e.g. Rancid)
// are buried under unrelated singles and never surface — so decks pin IDs.
async function fetchArtistAlbums(artist) {
  const params = new URLSearchParams({
    id: String(artist.id),
    entity: 'album',
    limit: '12',
  });

  // Proxied same-origin (vite dev proxy + vercel.json rewrite) because Apple's
  // CDN caches Access-Control-Allow-Origin per URL, so direct cross-origin
  // fetches break for every origin after the first to request a given URL
  const response = await fetch(`/itunes-api/lookup?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch albums from iTunes');

  const data = await response.json();

  // First result is the artist record itself; albums are collections
  return data.results.filter(
    (r) =>
      r.wrapperType === 'collection' &&
      r.collectionType === 'Album' &&
      r.artworkUrl100 &&
      r.releaseDate &&
      r.trackCount >= 5 && // skip singles and EPs
      !JUNK_NAME_PATTERN.test(r.collectionName)
  );
}

// Map an iTunes result onto the album shape the game uses (see extractUniqueAlbums).
// No per-track data is available without an extra lookup per album, so trackTitles
// stays empty — gameLogic falls back accordingly.
function toGameAlbum(result) {
  return {
    id: String(result.collectionId),
    name: stripEditionInfo(result.collectionName),
    imageUrl: result.artworkUrl100.replace('100x100', '600x600'),
    releaseYear: result.releaseDate.split('-')[0],
    totalTracks: result.trackCount,
    mainArtists: [result.artistName],
    allArtists: [result.artistName],
    trackTitles: [],
    trackIds: [],
    previewUrl: null,
    uri: result.collectionViewUrl,
    source: 'itunes',
  };
}

// A random album cover from a random pooled artist — used as label art for the
// CD on the landing/loading screens, so even a first-time visitor with nothing
// cached sees a real cover on the disc. One request per call.
export async function fetchRandomAlbumArtUrl() {
  const allArtists = GUEST_POOLS.flatMap((p) => p.artists);
  const artist = allArtists[Math.floor(Math.random() * allArtists.length)];
  const albums = await fetchArtistAlbums(artist);
  if (albums.length === 0) return null;
  const album = albums[Math.floor(Math.random() * albums.length)];
  return album.artworkUrl100.replace('100x100', '600x600');
}

// Fetch every artist in a pool in small batches (iTunes allows roughly 20
// requests/minute) and dedupe editions of the same album, keeping the first
// (highest-relevance) occurrence.
export async function fetchGuestPoolAlbums(poolId) {
  const pool = GUEST_POOLS.find((p) => p.id === poolId);
  if (!pool) throw new Error(`Unknown guest pool: ${poolId}`);

  const albums = [];
  const seen = new Set();
  const batchSize = 4;

  for (let i = 0; i < pool.artists.length; i += batchSize) {
    const batch = pool.artists.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(fetchArtistAlbums));
    for (const result of results.flat()) {
      const album = toGameAlbum(result);
      const key = `${normalizeString(album.name)}|${normalizeString(album.mainArtists[0])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      albums.push(album);
    }
    if (i + batchSize < pool.artists.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return albums;
}
