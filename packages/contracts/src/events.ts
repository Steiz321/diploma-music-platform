import { EventEnvelope } from './envelope';
import { StructuredLyrics } from './lyrics';
import { SongTags } from './tags';
import { PlaybackPayload, PlaybackSeekedPayload } from './playback';
import { ProfileUpdatedPayload } from './profile';
import { TranscriptionResult } from './transcription';

export const EVENT_TYPES = {
  userRegistered: 'user.registered',
  songUploaded: 'song.uploaded',
  songDeleted: 'song.deleted',
  songLiked: 'song.liked',
  songUnliked: 'song.unliked',
  playlistSongAdded: 'playlist.song_added',
  playlistSongRemoved: 'playlist.song_removed',
  songEnriched: 'song.enriched',
  songEnrichmentFailed: 'song.enrichment_failed',
  playbackStarted: 'playback.started',
  playbackProgress: 'playback.progress',
  playbackPaused: 'playback.paused',
  playbackResumed: 'playback.resumed',
  playbackSeeked: 'playback.seeked',
  playbackCompleted: 'playback.completed',
  playbackSkipped: 'playback.skipped',
  profileUpdated: 'profile.updated',
} as const;

/** Player events sent by the client to POST /events. */
export const PLAYBACK_EVENT_TYPES = [
  EVENT_TYPES.playbackStarted,
  EVENT_TYPES.playbackProgress,
  EVENT_TYPES.playbackPaused,
  EVENT_TYPES.playbackResumed,
  EVENT_TYPES.playbackSeeked,
  EVENT_TYPES.playbackCompleted,
  EVENT_TYPES.playbackSkipped,
] as const;

export type PlaybackEventType = (typeof PLAYBACK_EVENT_TYPES)[number];

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

export interface SongEnrichedPayload {
  song_id: number;
  /** no_lyrics: instrumental or nothing intelligible was transcribed */
  status: 'done' | 'no_lyrics';
  transcription: TranscriptionResult;
  /** plain lyrics, an empty line between verses; null for no_lyrics */
  text: string | null;
  /** null for no_lyrics or when the analysis failed */
  lyrics: StructuredLyrics | null;
  /** null for no_lyrics or when the analysis failed */
  tags: SongTags | null;
  vocabulary_version: number;
  models: {
    transcription: string;
    /** null when the LLM was not called */
    llm: string | null;
  };
}

/** Sent only when there is no transcription at all. */
export interface SongEnrichmentFailedPayload {
  song_id: number;
  stage: 'download' | 'transcription';
  reason: string;
  attempts: number;
}

/** payload type of every event type */
export interface EventPayloadMap {
  'user.registered': UserRegisteredPayload;
  'song.uploaded': SongUploadedPayload;
  'song.deleted': SongDeletedPayload;
  'song.liked': SongLikedPayload;
  'song.unliked': SongUnlikedPayload;
  'playlist.song_added': PlaylistSongAddedPayload;
  'playlist.song_removed': PlaylistSongRemovedPayload;
  'song.enriched': SongEnrichedPayload;
  'song.enrichment_failed': SongEnrichmentFailedPayload;
  'playback.started': PlaybackPayload;
  'playback.progress': PlaybackPayload;
  'playback.paused': PlaybackPayload;
  'playback.resumed': PlaybackPayload;
  'playback.seeked': PlaybackSeekedPayload;
  'playback.completed': PlaybackPayload;
  'playback.skipped': PlaybackPayload;
  'profile.updated': ProfileUpdatedPayload;
}

/** envelope of a known event type, e.g. PlatformEvent<'song.liked'> */
export type PlatformEvent<T extends EventType = EventType> = EventEnvelope<
  T,
  EventPayloadMap[T]
>;
