import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EVENT_TYPES,
  EventPayloadMap,
  PlatformEvent,
  SongEnrichmentFailedPayload,
  SongTags,
  StructuredLyrics,
  TAG_VOCABULARY_VERSION,
  toLanguageTag,
  TranscriptionResult,
} from '@platform/contracts';
import {
  createEvent,
  InboxService,
  OutboxPort,
  OutboxPortType,
} from '@platform/messaging';
import { Transcriber, TranscriberType } from '../transcription/transcriber';
import { Analyzer, AnalyzerType } from '../analysis/analyzer';
import { buildLyrics } from '../analysis/build-lyrics.util';
import {
  InvalidAnalysisError,
  lyricsToText,
  toStructuredLyrics,
  toTags,
} from '../analysis/analysis.mapper';
import { AudioNotFoundError, AudioStorage } from '../storage/audio-storage';
import { RetryExhaustedError, withRetry } from '../common/retry.util';
import { EnrichmentRepository } from './enrichment.repository';
import { EnrichmentStatus } from './song-enrichment.model';
import { PRODUCER } from './producer.constant';

export type EnrichmentOutcome = 'skipped' | 'done' | 'no_lyrics' | 'failed';

type SongUploadedEvent = PlatformEvent<'song.uploaded'>;

interface Analysis {
  instrumental: boolean;
  lyrics: StructuredLyrics | null;
  tags: SongTags | null;
}

// one extra call when the answer does not pass validation
const ANALYSIS_ATTEMPTS = 2;

/**
 * song.uploaded → download audio → transcribe → analyse → song.enriched.
 *
 * Transcription is required: without it the song gets song.enrichment_failed.
 * A failed analysis is not fatal: song.enriched goes out with lyrics/tags
 * null and the plain text built from the segments.
 * The result, the inbox record and the outgoing event are written in one
 * transaction; a repeated delivery of the same event is skipped.
 */
@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(
    private readonly repository: EnrichmentRepository,
    private readonly inbox: InboxService,
    @Inject(OutboxPortType)
    private readonly outbox: OutboxPort,
    @Inject(TranscriberType)
    private readonly transcriber: Transcriber,
    @Inject(AnalyzerType)
    private readonly analyzer: Analyzer,
    private readonly storage: AudioStorage,
  ) {}

  async enrich(event: SongUploadedEvent): Promise<EnrichmentOutcome> {
    if (await this.inbox.isProcessed(event.event_id)) {
      return 'skipped';
    }

    const { song_id: songId, audio_key: audioKey, title } = event.payload;
    await this.repository.markProcessing(songId, audioKey);

    let audio: Buffer;
    try {
      audio = await withRetry(() => this.storage.getAudio(audioKey), {
        label: `Download of ${audioKey}`,
        attempts: 3,
        baseDelayMs: 1_000,
        maxDelayMs: 10_000,
        isRetryable: (err) => !(err instanceof AudioNotFoundError),
        logger: this.logger,
      });
    } catch (err) {
      return this.fail(event, 'download', err);
    }

    let transcription: TranscriptionResult;
    try {
      transcription = await this.transcriber.transcribe(
        audio,
        audioKey.split('/').at(-1),
      );
    } catch (err) {
      return this.fail(event, 'transcription', err);
    }

    const plainText = buildLyrics(transcription.segments);
    if (!plainText) {
      return this.complete(event, {
        status: 'no_lyrics',
        transcription,
        text: null,
        lyrics: null,
        tags: null,
        llm: null,
      });
    }

    const { analysis, error } = await this.analyze(title, transcription);

    if (analysis?.instrumental) {
      return this.complete(event, {
        status: 'no_lyrics',
        transcription,
        text: null,
        lyrics: null,
        tags: null,
        llm: this.analyzer.model,
      });
    }

    return this.complete(event, {
      status: 'done',
      transcription,
      text: analysis ? lyricsToText(analysis.lyrics) : plainText,
      lyrics: analysis?.lyrics ?? null,
      tags: analysis?.tags ?? null,
      llm: this.analyzer.model,
      error,
    });
  }

  private async analyze(
    title: string,
    transcription: TranscriptionResult,
  ): Promise<{ analysis: Analysis | null; error?: string }> {
    const language = toLanguageTag(transcription.language);

    for (let attempt = 1; ; attempt++) {
      try {
        const output = await this.analyzer.analyze({ title, transcription });
        if (output.instrumental) {
          return { analysis: { instrumental: true, lyrics: null, tags: null } };
        }
        return {
          analysis: {
            instrumental: false,
            lyrics: toStructuredLyrics(output, transcription.segments),
            tags: toTags(output, language),
          },
        };
      } catch (err) {
        const retry =
          err instanceof InvalidAnalysisError && attempt < ANALYSIS_ATTEMPTS;
        this.logger.warn(
          `Analysis failed (attempt ${attempt}): ${err.message}${retry ? ', retrying' : ''}`,
        );
        if (!retry) {
          return { analysis: null, error: `analysis: ${err.message}` };
        }
      }
    }
  }

  private complete(
    event: SongUploadedEvent,
    result: Omit<
      EventPayloadMap['song.enriched'],
      'song_id' | 'vocabulary_version' | 'models'
    > & { llm: string | null; error?: string },
  ): Promise<EnrichmentOutcome> {
    const songId = event.payload.song_id;
    const { llm, error, ...payload } = result;

    return this.publishOnce(event, async (transaction) => {
      await this.repository.save(
        songId,
        {
          status: EnrichmentStatus[payload.status],
          transcription: payload.transcription,
          lyrics: payload.lyrics,
          tags: payload.tags,
          vocabulary_version: TAG_VOCABULARY_VERSION,
          last_error: error ?? null,
        },
        transaction,
      );

      await this.outbox.add(
        createEvent(
          PRODUCER,
          EVENT_TYPES.songEnriched,
          {
            song_id: songId,
            ...payload,
            vocabulary_version: TAG_VOCABULARY_VERSION,
            models: { transcription: this.transcriber.model, llm },
          },
          event.user_id,
        ),
        { transaction, aggregateType: 'song', aggregateId: songId },
      );

      return payload.status;
    });
  }

  private fail(
    event: SongUploadedEvent,
    stage: SongEnrichmentFailedPayload['stage'],
    err: unknown,
  ): Promise<EnrichmentOutcome> {
    const songId = event.payload.song_id;
    const reason = err instanceof Error ? err.message : String(err);
    const attempts = err instanceof RetryExhaustedError ? err.attempts : 1;
    this.logger.error(
      `Enrichment of song ${songId} failed at ${stage}: ${reason}`,
    );

    return this.publishOnce(event, async (transaction) => {
      await this.repository.save(
        songId,
        { status: EnrichmentStatus.failed, last_error: `${stage}: ${reason}` },
        transaction,
      );

      await this.outbox.add(
        createEvent(
          PRODUCER,
          EVENT_TYPES.songEnrichmentFailed,
          { song_id: songId, stage, reason, attempts },
          event.user_id,
        ),
        { transaction, aggregateType: 'song', aggregateId: songId },
      );

      return 'failed' as const;
    });
  }

  /** Inbox record, result and outgoing event in one transaction. */
  private publishOnce(
    event: SongUploadedEvent,
    work: (
      transaction: Parameters<OutboxPort['add']>[1]['transaction'],
    ) => Promise<EnrichmentOutcome>,
  ): Promise<EnrichmentOutcome> {
    return this.repository.transaction(async (transaction) => {
      if (!(await this.inbox.markProcessed(event.event_id, transaction))) {
        // a concurrent delivery of the same event got here first
        return 'skipped';
      }
      return work(transaction);
    });
  }
}
