import { Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { createEnvelope } from '@platform/contracts';
import { InboxService } from '@platform/messaging';
import { AnalyticsRepository } from '../common/analytics.repository';
import { IngestionService } from './ingestion.service';

const TX = { id: 'tx' } as unknown as Transaction;

describe('IngestionService', () => {
  let repository: jest.Mocked<AnalyticsRepository>;
  let inbox: jest.Mocked<InboxService>;
  let service: IngestionService;

  beforeAll(() => Logger.overrideLogger(false));

  beforeEach(() => {
    repository = {
      insertRawEvent: jest.fn(),
      upsertSong: jest.fn(),
      setSongTags: jest.fn(),
      markSongDeleted: jest.fn(),
      setLiked: jest.fn(),
      setInPlaylist: jest.fn(),
      getSessionForUpdate: jest.fn().mockResolvedValue(null),
      saveSession: jest.fn(),
      markUserChanged: jest.fn(),
      markSongAudienceChanged: jest.fn(),
    } as unknown as jest.Mocked<AnalyticsRepository>;
    inbox = {
      runOnce: jest.fn(async (_id, work) => ({
        processed: true,
        result: await work(TX),
      })),
    } as unknown as jest.Mocked<InboxService>;
    service = new IngestionService(repository, inbox);
  });

  it('logs the raw event and starts a listening session', async () => {
    const event = createEnvelope(
      'playback.started',
      {
        play_id: 'play-1',
        song_id: 42,
        position_sec: 0,
        duration_sec: 200,
        source: { type: 'feed' },
      },
      { producer: 'core', user_id: 5 },
    );

    await expect(service.ingest(event)).resolves.toBe('processed');

    expect(repository.insertRawEvent).toHaveBeenCalledWith(event, TX);
    expect(repository.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        play_id: 'play-1',
        user_id: 5,
        song_id: 42,
        playing: true,
      }),
      TX,
    );
    expect(repository.markUserChanged).toHaveBeenCalledWith(5, TX);
  });

  it('skips an event that was already ingested', async () => {
    inbox.runOnce.mockResolvedValue({ processed: false });

    await expect(
      service.ingest(
        createEnvelope(
          'song.liked',
          { song_id: 1, user_id: 5 },
          { producer: 'core' },
        ),
      ),
    ).resolves.toBe('skipped');
  });

  it('stores like state from the payload user and marks the profile', async () => {
    const event = createEnvelope(
      'song.unliked',
      { song_id: 42, user_id: 5 },
      { producer: 'core' },
    );

    await service.ingest(event);

    expect(repository.setLiked).toHaveBeenCalledWith(
      5,
      42,
      false,
      event.occurred_at,
      TX,
    );
    expect(repository.markUserChanged).toHaveBeenCalledWith(5, TX);
  });

  it('tracks playlist membership', async () => {
    await service.ingest(
      createEnvelope(
        'playlist.song_added',
        { playlist_id: 3, song_id: 42, user_id: 5 },
        { producer: 'core' },
      ),
    );

    expect(repository.setInPlaylist).toHaveBeenCalledWith(5, 42, 3, true, TX);
  });

  it('marks everyone who heard a song when its tags arrive late', async () => {
    await service.ingest(
      createEnvelope(
        'song.enriched',
        {
          song_id: 42,
          status: 'done',
          transcription: {
            text: '',
            language: 'en',
            duration: 1,
            segments: [],
          },
          text: 'la',
          lyrics: null,
          tags: {
            mood: ['sad'],
            topics: ['love'],
            energy: 'low',
            language: 'en',
          },
          vocabulary_version: 1,
          models: { transcription: 'fake', llm: 'fake' },
        },
        { producer: 'ai-enrichment' },
      ),
    );

    expect(repository.setSongTags).toHaveBeenCalledWith(
      42,
      { mood: ['sad'], topics: ['love'], energy: 'low', language: 'en' },
      1,
      TX,
    );
    expect(repository.markSongAudienceChanged).toHaveBeenCalledWith(42, TX);
  });

  it('keeps a playback event without user_id in the raw log only', async () => {
    const event = createEnvelope(
      'playback.progress',
      {
        play_id: 'play-1',
        song_id: 42,
        position_sec: 15,
        duration_sec: 200,
        source: { type: 'feed' },
      },
      { producer: 'core' },
    );

    await service.ingest(event);

    expect(repository.insertRawEvent).toHaveBeenCalled();
    expect(repository.saveSession).not.toHaveBeenCalled();
  });
});
