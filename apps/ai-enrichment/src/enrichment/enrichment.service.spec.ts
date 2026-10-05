import { Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import {
  createEnvelope,
  PlatformEvent,
  TranscriptionResult,
} from '@platform/contracts';
import {
  InboxService,
  OutboxPort,
  withEventContext,
} from '@platform/messaging';
import { Transcriber } from '../transcription/transcriber';
import { AnalysisOutput, Analyzer } from '../analysis/analyzer';
import { AudioNotFoundError, AudioStorage } from '../storage/audio-storage';
import { RetryExhaustedError } from '../common/retry.util';
import { EnrichmentRepository } from './enrichment.repository';
import { EnrichmentService } from './enrichment.service';
import { EnrichmentStatus } from './song-enrichment.model';

const TX = { id: 'tx' } as unknown as Transaction;

const TRANSCRIPTION: TranscriptionResult = {
  text: 'Today is gonna be the day. And after all',
  language: 'en',
  duration: 30,
  segments: [
    {
      start: 0,
      end: 2,
      text: ' Today is gonna be the day',
      avgLogprob: -0.2,
      noSpeechProb: 0,
    },
    {
      start: 6,
      end: 8,
      text: ' And after all',
      avgLogprob: -0.1,
      noSpeechProb: 0,
    },
  ],
};

const ANALYSIS: AnalysisOutput = {
  instrumental: false,
  verses: [
    {
      kind: 'verse',
      lines: [{ segment: 0, text: 'Today is gonna be the day' }],
    },
    { kind: 'chorus', lines: [{ segment: 1, text: 'And after all' }] },
  ],
  tags: {
    mood: ['melancholic', 'hopeful', 'calm', 'dark'],
    topics: ['love'],
    energy: 'medium',
  },
};

const songUploaded = (): PlatformEvent<'song.uploaded'> =>
  createEnvelope(
    'song.uploaded',
    {
      song_id: 42,
      author_id: 7,
      audio_key: 'song/song&abc.mp3',
      title: 'Wonderwall',
    },
    { producer: 'core', correlation_id: 'req-1', user_id: 7 },
  );

describe('EnrichmentService', () => {
  let repository: jest.Mocked<EnrichmentRepository>;
  let inbox: jest.Mocked<InboxService>;
  let outbox: jest.Mocked<OutboxPort>;
  let transcriber: jest.Mocked<Transcriber>;
  let analyzer: jest.Mocked<Analyzer>;
  let storage: jest.Mocked<AudioStorage>;
  let service: EnrichmentService;

  /** the single event written to the outbox */
  const publishedEvent = () => {
    expect(outbox.add).toHaveBeenCalledTimes(1);
    const [envelope, options] = outbox.add.mock.calls[0];
    expect(options).toEqual({
      transaction: TX,
      aggregateType: 'song',
      aggregateId: 42,
    });
    return envelope as PlatformEvent<any>;
  };

  beforeAll(() => Logger.overrideLogger(false));

  beforeEach(() => {
    repository = {
      transaction: jest.fn((work) => work(TX)),
      markProcessing: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EnrichmentRepository>;
    inbox = {
      isProcessed: jest.fn().mockResolvedValue(false),
      markProcessed: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<InboxService>;
    outbox = {
      add: jest.fn().mockResolvedValue(undefined),
      addMany: jest.fn(),
    };
    transcriber = {
      model: 'whisper-large-v3',
      transcribe: jest.fn().mockResolvedValue(TRANSCRIPTION),
    };
    analyzer = {
      model: 'openai/gpt-oss-120b',
      analyze: jest.fn().mockResolvedValue(ANALYSIS),
    };
    storage = {
      getAudio: jest.fn().mockResolvedValue(Buffer.from('audio')),
    } as unknown as jest.Mocked<AudioStorage>;

    service = new EnrichmentService(
      repository,
      inbox,
      outbox,
      transcriber,
      analyzer,
      storage,
    );
  });

  it('publishes song.enriched with structured lyrics, validated tags and the same correlation_id', async () => {
    const event = songUploaded();

    const outcome = await withEventContext(event, () => service.enrich(event));

    expect(outcome).toBe('done');
    expect(transcriber.transcribe).toHaveBeenCalledWith(
      Buffer.from('audio'),
      'song&abc.mp3',
    );
    const published = publishedEvent();
    expect(published).toMatchObject({
      type: 'song.enriched',
      producer: 'ai-enrichment',
      correlation_id: 'req-1',
      user_id: 7,
      payload: {
        song_id: 42,
        status: 'done',
        text: 'Today is gonna be the day\n\nAnd after all',
        lyrics: {
          verses: [
            {
              kind: 'verse',
              lines: [{ start: 0, end: 2, text: 'Today is gonna be the day' }],
            },
            {
              kind: 'chorus',
              lines: [{ start: 6, end: 8, text: 'And after all' }],
            },
          ],
        },
        // at most 3 moods; language from Whisper
        tags: {
          mood: ['melancholic', 'hopeful', 'calm'],
          topics: ['love'],
          energy: 'medium',
          language: 'en',
        },
        vocabulary_version: 1,
        models: {
          transcription: 'whisper-large-v3',
          llm: 'openai/gpt-oss-120b',
        },
      },
    });
    expect(repository.save).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: EnrichmentStatus.done,
        last_error: null,
      }),
      TX,
    );
    expect(inbox.markProcessed).toHaveBeenCalledWith(event.event_id, TX);
  });

  it('skips an event that was already processed', async () => {
    inbox.isProcessed.mockResolvedValue(true);

    await expect(service.enrich(songUploaded())).resolves.toBe('skipped');

    expect(storage.getAudio).not.toHaveBeenCalled();
    expect(transcriber.transcribe).not.toHaveBeenCalled();
    expect(outbox.add).not.toHaveBeenCalled();
  });

  it('publishes nothing when a concurrent delivery recorded the event first', async () => {
    inbox.markProcessed.mockResolvedValue(false);

    await expect(service.enrich(songUploaded())).resolves.toBe('skipped');

    expect(repository.save).not.toHaveBeenCalled();
    expect(outbox.add).not.toHaveBeenCalled();
  });

  it('publishes song.enrichment_failed when transcription fails after retries', async () => {
    transcriber.transcribe.mockRejectedValue(
      new RetryExhaustedError(3, new Error('429 Too Many Requests')),
    );

    await expect(service.enrich(songUploaded())).resolves.toBe('failed');

    expect(analyzer.analyze).not.toHaveBeenCalled();
    expect(publishedEvent()).toMatchObject({
      type: 'song.enrichment_failed',
      payload: {
        song_id: 42,
        stage: 'transcription',
        reason: '429 Too Many Requests',
        attempts: 3,
      },
    });
    expect(repository.save).toHaveBeenCalledWith(
      42,
      {
        status: EnrichmentStatus.failed,
        last_error: 'transcription: 429 Too Many Requests',
      },
      TX,
    );
  });

  it('does not retry a download of a missing file', async () => {
    storage.getAudio.mockRejectedValue(
      new AudioNotFoundError('song/missing.mp3'),
    );

    await expect(service.enrich(songUploaded())).resolves.toBe('failed');

    expect(storage.getAudio).toHaveBeenCalledTimes(1);
    expect(transcriber.transcribe).not.toHaveBeenCalled();
    expect(publishedEvent()).toMatchObject({
      type: 'song.enrichment_failed',
      payload: { stage: 'download', attempts: 1 },
    });
  });

  it('publishes song.enriched without lyrics and tags when only the analysis fails', async () => {
    analyzer.analyze.mockRejectedValue(new Error('Groq is down'));

    await expect(service.enrich(songUploaded())).resolves.toBe('done');

    expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    expect(publishedEvent()).toMatchObject({
      type: 'song.enriched',
      payload: {
        status: 'done',
        // plain text from the segments
        text: 'Today is gonna be the day\n\nAnd after all',
        lyrics: null,
        tags: null,
      },
    });
    expect(repository.save).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ last_error: 'analysis: Groq is down' }),
      TX,
    );
  });

  it('asks the model once more when its answer does not pass validation', async () => {
    analyzer.analyze
      .mockResolvedValueOnce({
        ...ANALYSIS,
        tags: { mood: [], topics: [], energy: 'low' },
      })
      .mockResolvedValueOnce(ANALYSIS);

    await expect(service.enrich(songUploaded())).resolves.toBe('done');

    expect(analyzer.analyze).toHaveBeenCalledTimes(2);
    expect(publishedEvent().payload.tags).not.toBeNull();
  });

  it('marks a song without lyrics as no_lyrics without calling the model', async () => {
    transcriber.transcribe.mockResolvedValue({
      ...TRANSCRIPTION,
      text: '🎵',
      segments: [
        { start: 0, end: 30, text: ' 🎵', avgLogprob: -0.5, noSpeechProb: 0.9 },
      ],
    });

    await expect(service.enrich(songUploaded())).resolves.toBe('no_lyrics');

    expect(analyzer.analyze).not.toHaveBeenCalled();
    expect(publishedEvent()).toMatchObject({
      type: 'song.enriched',
      payload: {
        status: 'no_lyrics',
        text: null,
        lyrics: null,
        tags: null,
        models: { transcription: 'whisper-large-v3', llm: null },
      },
    });
  });
});
