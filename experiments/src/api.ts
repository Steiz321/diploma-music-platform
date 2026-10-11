import type { SongTags } from '@platform/contracts';
import { config } from './config.ts';

export interface User {
  id: number;
  token: string;
}

export interface PlaybackEvent {
  event_id: string;
  type: string;
  occurred_at: string;
  play_id: string;
  song_id: number;
  position_sec: number;
  duration_sec: number;
  source: { type: string };
}

const request = async <T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> => {
  const { token, headers, ...rest } = init;
  const response = await fetch(`${config.coreUrl}${path}`, {
    ...rest,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });
  const body = (await response.json()) as { data: T; error: unknown };
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path}: ${response.status} ${JSON.stringify(body.error)}`);
  }
  return body.data;
};

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

/** Thin client of the Core API used by the simulator. */
export const api = {
  async register(username: string): Promise<User> {
    const form = new FormData();
    form.set('username', username);
    form.set('email', `${username}@sim.local`);
    form.set('password', 'simulated');
    const data = await request<{ id: number; token: string }>('/register', {
      method: 'POST',
      body: form,
    });
    return { id: data.id, token: data.token };
  },

  /** A song with a tiny dummy file: events are synthetic, audio is never played. */
  async uploadSong(user: User, name: string): Promise<number> {
    const form = new FormData();
    form.set('name', name);
    form.set('audio', new Blob([new Uint8Array(1024)], { type: 'audio/mpeg' }), 'sim.mp3');
    const data = await request<{ id: number }>('/song', {
      method: 'POST',
      body: form,
      token: user.token,
    });
    return data.id;
  },

  getSong(user: User, id: number) {
    return request<{ id: number; transcription_status: string; tags: SongTags | null }>(
      `/song/${id}`,
      { token: user.token },
    );
  },

  sendEvents(user: User, events: PlaybackEvent[]) {
    return request<{ accepted: number; duplicates: number }>('/events', {
      ...json({ events }),
      token: user.token,
    });
  },

  like(user: User, songId: number) {
    return request('/song-like', { ...json({ songId }), token: user.token });
  },

  async createPlaylist(user: User, title: string): Promise<number> {
    const form = new FormData();
    form.set('title', title);
    form.set('cover', new Blob([new Uint8Array(64)], { type: 'image/jpeg' }), 'cover.jpg');
    const data = await request<{ id: number }>('/playlist', {
      method: 'POST',
      body: form,
      token: user.token,
    });
    return data.id;
  },

  addToPlaylist(user: User, playlistId: number, songId: number) {
    return request(`/playlist/${playlistId}/song`, {
      ...json({ songId }),
      token: user.token,
    });
  },
};
