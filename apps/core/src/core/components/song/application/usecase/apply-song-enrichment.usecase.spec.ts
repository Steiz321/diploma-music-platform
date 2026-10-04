import { Transaction } from 'sequelize';
import { createEnvelope, PlatformEvent } from '@platform/contracts';
import { InboxService } from '@platform/messaging';
import { TranscriptionStatus } from 'src/core/shared-kernel/data/enum/transcription-status.enum';
import { SongRepository } from '../../ports/song.repository';
import ApplySongEnrichmentUseCase from './apply-song-enrichment.usecase';

const TX = { id: 'tx' } as unknown as Transaction;

const TRANSCRIPTION = {
  text: 'And after all',
  language: 'en',
  duration: 10,
  segments: [
    {
      start: 1,
      end: 3,
      text: ' And after all',
      avgLogprob: -0.1,
      noSpeechProb: 0,
    },
  ],
};

const songEnriched = (): PlatformEvent<'song.enriched'> =>
  createEnvelope(
    'song.enriched',
    {
      song_id: 42,
      status: 'done',
      transcription: TRANSCRIPTION,
      text: 'And after all',
      lyrics: {
        verses: [
          {
            kind: 'chorus',
            lines: [{ start: 1, end: 3, text: 'And after all' }],
          },
        ],
      },
      tags: {
        mood: ['hopeful'],
        topics: ['love'],
        energy: 'medium',
        language: 'en',
      },
      vocabulary_version: 1,
      models: { transcription: 'whisper-large-v3', llm: 'openai/gpt-oss-120b' },
    },
    { producer: 'ai-enrichment' },
  );

describe('ApplySongEnrichmentUseCase', () => {
  let songRepository: jest.Mocked<SongRepository>;
  let inbox: jest.Mocked<InboxService>;
  let useCase: ApplySongEnrichmentUseCase;

  beforeEach(() => {
    songRepository = {
      getOneWhere: jest.fn().mockResolvedValue({ id: 42 }),
      update: jest.fn().mockResolvedValue({ id: 42 }),
    } as unknown as jest.Mocked<SongRepository>;
    // runs the work as the real inbox would for a new event
    inbox = {
      runOnce: jest.fn(async (_eventId, work) => ({
        processed: true,
        result: await work(TX),
      })),
    } as unknown as jest.Mocked<InboxService>;
    useCase = new ApplySongEnrichmentUseCase(songRepository, inbox);
  });

  it('stores the transcription, lyrics and tags of song.enriched', async () => {
    const event = songEnriched();

    await expect(useCase.execute(event)).resolves.toBe('applied');

    expect(inbox.runOnce).toHaveBeenCalledWith(
      event.event_id,
      expect.any(Function),
    );
    expect(songRepository.update).toHaveBeenCalledWith(
      {
        transcription: TRANSCRIPTION,
        transcription_status: TranscriptionStatus.done,
        language: 'en',
        text: 'And after all',
        lyrics: event.payload.lyrics,
        tags: event.payload.tags,
        vocabulary_version: 1,
      },
      { id: 42 },
      TX,
    );
  });

  it('marks the song as no_lyrics', async () => {
    const event = songEnriched();
    event.payload = {
      ...event.payload,
      status: 'no_lyrics',
      text: null,
      lyrics: null,
      tags: null,
    };

    await useCase.execute(event);

    expect(songRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        transcription_status: TranscriptionStatus.no_lyrics,
        text: null,
        tags: null,
      }),
      { id: 42 },
      TX,
    );
  });

  it('marks the song as failed on song.enrichment_failed', async () => {
    const event = createEnvelope(
      'song.enrichment_failed',
      { song_id: 42, stage: 'transcription', reason: 'timeout', attempts: 3 },
      { producer: 'ai-enrichment' },
    );

    await useCase.execute(event);

    expect(songRepository.update).toHaveBeenCalledWith(
      { transcription_status: TranscriptionStatus.failed },
      { id: 42 },
      TX,
    );
  });

  it('ignores a repeated delivery of the same event', async () => {
    inbox.runOnce.mockResolvedValue({ processed: false });

    await expect(useCase.execute(songEnriched())).resolves.toBe('skipped');

    expect(songRepository.update).not.toHaveBeenCalled();
  });

  it('ignores an event for a deleted song', async () => {
    songRepository.getOneWhere.mockResolvedValue(null);

    await expect(useCase.execute(songEnriched())).resolves.toBe('song_missing');

    expect(songRepository.update).not.toHaveBeenCalled();
  });
});
