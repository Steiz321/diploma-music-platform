import { createEnvelope } from '@platform/contracts';
import { IngestionService } from './ingestion.service';
import {
  AnalyticsEventsConsumer,
  isValidAnalyticsEvent,
} from './analytics-events.consumer';

const like = (producer: string) =>
  createEnvelope('song.liked', { song_id: 42, user_id: 5 }, { producer });

describe('AnalyticsEventsConsumer', () => {
  it('accepts events from the service that owns their type', () => {
    expect(isValidAnalyticsEvent(like('core'))).toBe(true);
    expect(
      isValidAnalyticsEvent(
        createEnvelope(
          'song.enriched',
          {
            song_id: 42,
            status: 'no_lyrics',
            transcription: {
              text: '',
              language: null,
              duration: 1,
              segments: [],
            },
            text: null,
            lyrics: null,
            tags: null,
            vocabulary_version: 1,
            models: { transcription: 'fake', llm: null },
          },
          { producer: 'ai-enrichment' },
        ),
      ),
    ).toBe(true);
  });

  it('rejects a like or a player event forged by another producer', async () => {
    const ingestion = { ingest: jest.fn() } as unknown as IngestionService;
    const consumer = new AnalyticsEventsConsumer(ingestion);

    await expect(consumer.handle(like('analytics'))).rejects.toThrow(
      'Invalid analytics message',
    );
    await expect(
      consumer.handle(
        createEnvelope(
          'playback.completed',
          {
            play_id: 'p',
            song_id: 42,
            position_sec: 200,
            duration_sec: 200,
            source: { type: 'feed' },
          },
          { producer: 'manual-test', user_id: 5 },
        ),
      ),
    ).rejects.toThrow('Invalid analytics message');
    expect(ingestion.ingest).not.toHaveBeenCalled();
  });
});
