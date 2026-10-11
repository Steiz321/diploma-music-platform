import { EventEnvelope } from './envelope';
import { EventType } from './events';

/**
 * The only service allowed to publish each event type. Consumers check it,
 * so a process that can reach the broker cannot forge, e.g., likes or player
 * events of another user with a different producer.
 */
export const EVENT_PRODUCERS: Record<EventType, string> = {
  'user.registered': 'core',
  'song.uploaded': 'core',
  'song.deleted': 'core',
  'song.liked': 'core',
  'song.unliked': 'core',
  'playlist.song_added': 'core',
  'playlist.song_removed': 'core',
  'playback.started': 'core',
  'playback.progress': 'core',
  'playback.paused': 'core',
  'playback.resumed': 'core',
  'playback.seeked': 'core',
  'playback.completed': 'core',
  'playback.skipped': 'core',
  'song.enriched': 'ai-enrichment',
  'song.enrichment_failed': 'ai-enrichment',
  'profile.updated': 'analytics',
  'scores.updated': 'analytics',
};

/** True when the envelope comes from the service that owns its type. */
export const isFromExpectedProducer = (envelope: EventEnvelope): boolean =>
  EVENT_PRODUCERS[envelope.type as EventType] === envelope.producer;
