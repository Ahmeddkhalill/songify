import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const OUTPUT = '../backend/src/Songify.Infrastructure/Persistence/SeedData/songs.json';
const DELAY_MS = 2000;

const queries = [
  'Bohemian Rhapsody Queen',
  'Stairway to Heaven Led Zeppelin',
  'Hotel California Eagles',
  'Smells Like Teen Spirit Nirvana',
  'Billie Jean Michael Jackson',
  'Imagine John Lennon',
  'Sweet Child O Mine Guns N Roses',
  'Wonderwall Oasis',
  'Lose Yourself Eminem',
  'Rolling in the Deep Adele',
  'Blinding Lights The Weeknd',
  'Shape of You Ed Sheeran',
  'Bad Guy Billie Eilish',
  'Uptown Funk Mark Ronson Bruno Mars',
  'Somebody That I Used to Know Gotye',
  'Take Five Dave Brubeck',
  'So What Miles Davis',
  'Clocks Coldplay',
  'Numb Linkin Park',
  'Africa Toto'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function lookup(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const track = data.results?.[0];

  if (!track) {
    return null;
  }

  return {
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName ?? null,
    durationInSeconds: Math.round(track.trackTimeMillis / 1000),
    coverImageUrl: track.artworkUrl100?.replace('100x100', '400x400') ?? null,
    previewUrl: track.previewUrl ?? null
  };
}

const songs = [];

for (const query of queries) {
  try {
    const song = await lookup(query);

    if (song) {
      songs.push(song);
      console.log(`  ok   ${song.title} — ${song.artist}`);
    } else {
      console.warn(`  miss ${query}`);
    }
  } catch (error) {
    console.error(`  fail ${query}: ${error.message}`);
  }

  await sleep(DELAY_MS);
}

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, JSON.stringify(songs, null, 2), 'utf8');

console.log(`\nWrote ${songs.length} songs to ${OUTPUT}`);