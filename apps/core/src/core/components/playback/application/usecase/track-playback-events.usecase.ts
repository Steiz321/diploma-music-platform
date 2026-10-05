import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { EventPayloadMap, PlaybackEventType } from '@platform/contracts';
import { OutboxPort, OutboxPortType } from '@platform/messaging';
import { UseCase } from 'src/core/shared-kernel/interfaces/use-case';
import { newEvent } from 'src/core/shared-kernel/events/new-event';
import { PlaybackEventDto } from '../data/request/track-playback-events.request';
import { TrackPlaybackEventsResponse } from '../data/response/track-playback-events.response';

interface TrackPlaybackEventsArguments {
  userId: number;
  events: PlaybackEventDto[];
}

// client clocks drift; times outside this window are replaced by server time
const MAX_FUTURE_SKEW_MS = 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Client time when it is plausible, otherwise the time of receiving. */
export const resolveOccurredAt = (clientTime: string, now: Date): Date => {
  const time = Date.parse(clientTime);
  const plausible =
    !Number.isNaN(time) &&
    time <= now.getTime() + MAX_FUTURE_SKEW_MS &&
    time >= now.getTime() - MAX_AGE_MS;
  return plausible ? new Date(time) : now;
};

const toPayload = (
  event: PlaybackEventDto,
): EventPayloadMap[PlaybackEventType] => {
  const payload = {
    play_id: event.play_id,
    song_id: event.song_id,
    position_sec: event.position_sec,
    duration_sec: event.duration_sec ?? null,
    source: {
      type: event.source.type,
      ...(event.source.id !== undefined && { id: event.source.id }),
    },
  };

  return event.type === 'playback.seeked'
    ? { ...payload, from_sec: event.from_sec, to_sec: event.to_sec }
    : payload;
};

/**
 * Player events from the client: user_id comes from the auth token, every
 * event becomes an envelope in the outbox (one transaction for the batch),
 * so they reach RabbitMQ even if the broker is down right now. The client's
 * event_id makes retried batches idempotent.
 */
@Injectable()
export default class TrackPlaybackEventsUseCase
  implements UseCase<TrackPlaybackEventsArguments, TrackPlaybackEventsResponse>
{
  constructor(
    private readonly sequelize: Sequelize,
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
  ) {}

  public async execute({
    userId,
    events,
  }: TrackPlaybackEventsArguments): Promise<TrackPlaybackEventsResponse> {
    const now = new Date();

    const entries = events.map((event) => ({
      envelope: newEvent(event.type, toPayload(event), userId, {
        eventId: event.event_id,
        occurredAt: resolveOccurredAt(event.occurred_at, now),
      }),
      aggregateType: 'song',
      aggregateId: event.song_id,
    }));

    const stored = await this.sequelize.transaction((transaction) =>
      this.outbox.addMany(entries, { transaction }),
    );

    return { accepted: events.length, duplicates: events.length - stored };
  }
}
