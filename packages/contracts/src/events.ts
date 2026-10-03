import { EventEnvelope } from './envelope';

export const EVENT_TYPES = {
  userRegistered: 'user.registered',
  songUploaded: 'song.uploaded',
  songDeleted: 'song.deleted',
  songLiked: 'song.liked',
  songUnliked: 'song.unliked',
  playlistSongAdded: 'playlist.song_added',
  playlistSongRemoved: 'playlist.song_removed',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface UserRegisteredPayload {
  user_id: number;
}

export interface SongUploadedPayload {
  song_id: number;
  author_id: number;
  /** object key in the S3 bucket (MinIO), not a public URL */
  audio_key: string;
  title: string;
}

export interface SongDeletedPayload {
  song_id: number;
  author_id: number;
}

export interface SongLikedPayload {
  song_id: number;
  user_id: number;
}

export type SongUnlikedPayload = SongLikedPayload;

export interface PlaylistSongAddedPayload {
  playlist_id: number;
  song_id: number;
  user_id: number;
}

export type PlaylistSongRemovedPayload = PlaylistSongAddedPayload;

/** payload type of every event type */
export interface EventPayloadMap {
  'user.registered': UserRegisteredPayload;
  'song.uploaded': SongUploadedPayload;
  'song.deleted': SongDeletedPayload;
  'song.liked': SongLikedPayload;
  'song.unliked': SongUnlikedPayload;
  'playlist.song_added': PlaylistSongAddedPayload;
  'playlist.song_removed': PlaylistSongRemovedPayload;
}

/** envelope of a known event type, e.g. PlatformEvent<'song.liked'> */
export type PlatformEvent<T extends EventType = EventType> = EventEnvelope<
  T,
  EventPayloadMap[T]
>;
