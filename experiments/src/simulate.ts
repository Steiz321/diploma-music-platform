// User simulator: synthetic listeners with persona tastes use the real API
// (upload, player events, likes, playlists). Half of the catalogue is shown
// to each user; the other half is held out for the offline evaluation.
//
//   npm run simulate            (SONGS=80 USERS_PER_PERSONA=5 SEED=2026)
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { faker } from '@faker-js/faker';
import type { SongTags } from '@platform/contracts';
import { api, type PlaybackEvent, type User } from './api.ts';
import { config } from './config.ts';
import { affinity, PERSONAS, type Persona } from './personas.ts';

const SONGS = Number(process.env.SONGS ?? 80);
const USERS_PER_PERSONA = Number(process.env.USERS_PER_PERSONA ?? 5);
/** share of the catalogue each user hears; the rest is held out */
const EXPOSURE = 0.5;
/** taste is not exact: noise added to the affinity of every decision */
const NOISE = 0.5;
const PROGRESS_STEP_SEC = 15;
const MAX_EVENTS_PER_REQUEST = 50;

export interface CatalogSong {
  id: number;
  title: string;
  tags: SongTags;
}

export interface SimulatedUser {
  id: number;
  username: string;
  persona: string;
  /** songs the user heard (training data); the rest is held out */
  exposed: number[];
}

export interface SimulationRun {
  run: string;
  seed: number;
  created_at: string;
  catalog: CatalogSong[];
  users: SimulatedUser[];
  behaviour: Record<string, number>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...args: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...args);

/** Uploads the catalogue and waits for AI enrichment to tag every song. */
const createCatalog = async (author: User): Promise<CatalogSong[]> => {
  // seeded titles: the fake analyzer derives tags from the title, so every
  // run gets the same tags
  const titles = Array.from({ length: SONGS }, (_, i) => `${faker.music.songName()} ${i + 1}`);
  const ids: number[] = [];
  for (const title of titles) {
    ids.push(await api.uploadSong(author, title));
  }
  log(`uploaded ${ids.length} songs, waiting for enrichment...`);

  const catalog: CatalogSong[] = [];
  const deadline = Date.now() + 15 * 60_000;
  for (let i = 0; i < ids.length; i++) {
    for (;;) {
      const song = await api.getSong(author, ids[i]);
      if (song.transcription_status !== 'pending') {
        if (song.tags) catalog.push({ id: song.id, title: titles[i], tags: song.tags });
        break;
      }
      if (Date.now() > deadline) throw new Error('enrichment timed out');
      await sleep(1000);
    }
  }
  log(`${catalog.length} songs tagged`);
  return catalog;
};

type Outcome = 'completed' | 'partial' | 'skipped' | 'skipped_early';

/** What the persona does with a song it hears. */
const decide = (persona: Persona, song: CatalogSong) => {
  const taste = affinity(persona, song.tags) + faker.number.float({ min: -NOISE, max: NOISE });
  const duration = faker.number.int({ min: 120, max: 200 });

  let outcome: Outcome;
  let position: number;
  if (taste >= 2) {
    outcome = 'completed';
    position = duration;
  } else if (taste >= 1) {
    outcome = faker.datatype.boolean(0.5) ? 'completed' : 'partial';
    position = outcome === 'completed' ? duration : Math.round(duration * faker.number.float({ min: 0.5, max: 0.9 }));
  } else if (taste >= 0) {
    outcome = faker.datatype.boolean(0.5) ? 'partial' : 'skipped';
    position = Math.round(duration * faker.number.float({ min: 0.2, max: 0.6 }));
  } else {
    outcome = 'skipped_early';
    position = faker.number.int({ min: 3, max: 20 });
  }

  return {
    outcome,
    duration,
    position,
    like: taste >= 2 && faker.datatype.boolean(0.6),
    playlist: taste >= 2 && faker.datatype.boolean(0.3),
  };
};

/** Player events of one listening session, in the past from `startMs`. */
const sessionEvents = (
  songId: number,
  startMs: number,
  duration: number,
  position: number,
  outcome: Outcome,
): PlaybackEvent[] => {
  const playId = randomUUID();
  const event = (type: string, atSec: number): PlaybackEvent => ({
    event_id: randomUUID(),
    type,
    occurred_at: new Date(startMs + atSec * 1000).toISOString(),
    play_id: playId,
    song_id: songId,
    position_sec: atSec,
    duration_sec: duration,
    source: { type: 'feed' },
  });

  const events = [event('playback.started', 0)];
  for (let at = PROGRESS_STEP_SEC; at < position; at += PROGRESS_STEP_SEC) {
    events.push(event('playback.progress', at));
  }
  events.push(event(outcome === 'completed' ? 'playback.completed' : outcome === 'partial' ? 'playback.paused' : 'playback.skipped', position));
  return events;
};

const simulateUser = async (
  user: User,
  username: string,
  persona: Persona,
  catalog: CatalogSong[],
  behaviour: Record<string, number>,
): Promise<SimulatedUser> => {
  const exposed = faker.helpers.arrayElements(catalog, Math.round(catalog.length * EXPOSURE));
  // the history happened during the last hours (the server accepts <= 24 h)
  let clock = Date.now() - 20 * 3600_000;
  const events: PlaybackEvent[] = [];
  let playlistId: number | null = null;

  for (const song of exposed) {
    const decision = decide(persona, song);
    behaviour[decision.outcome] = (behaviour[decision.outcome] ?? 0) + 1;
    events.push(...sessionEvents(song.id, clock, decision.duration, decision.position, decision.outcome));
    clock += (decision.position + faker.number.int({ min: 2, max: 30 })) * 1000;

    if (decision.like) {
      await api.like(user, song.id);
      behaviour.likes = (behaviour.likes ?? 0) + 1;
    }
    if (decision.playlist) {
      playlistId ??= await api.createPlaylist(user, `${persona.name} mix`);
      await api.addToPlaylist(user, playlistId, song.id);
      behaviour.playlist_adds = (behaviour.playlist_adds ?? 0) + 1;
    }
  }

  for (let i = 0; i < events.length; i += MAX_EVENTS_PER_REQUEST) {
    await api.sendEvents(user, events.slice(i, i + MAX_EVENTS_PER_REQUEST));
  }
  behaviour.events = (behaviour.events ?? 0) + events.length;

  return { id: user.id, username, persona: persona.name, exposed: exposed.map((song) => song.id) };
};

const main = async () => {
  faker.seed(config.seed);
  const run = `${new Date().toISOString().slice(0, 10)}-${Date.now() % 100_000}`;
  log(`run ${run}: ${SONGS} songs, ${USERS_PER_PERSONA} users x ${PERSONAS.length} personas, seed ${config.seed}`);

  const author = await api.register(`sim-author-${run}`);
  const catalog = await createCatalog(author);

  const users: SimulatedUser[] = [];
  const behaviour: Record<string, number> = {};
  for (const persona of PERSONAS) {
    for (let i = 1; i <= USERS_PER_PERSONA; i++) {
      const username = `sim-${persona.name}-${i}-${run}`;
      const user = await api.register(username);
      users.push(await simulateUser(user, username, persona, catalog, behaviour));
    }
    log(`persona ${persona.name}: ${USERS_PER_PERSONA} users done`);
  }

  const result: SimulationRun = { run, seed: config.seed, created_at: new Date().toISOString(), catalog, users, behaviour };
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  const file = new URL(`../data/run-${run}.json`, import.meta.url);
  await writeFile(file, JSON.stringify(result, null, 2));
  log('behaviour', JSON.stringify(behaviour));
  log(`saved ${file.pathname}`);
};

await main();
