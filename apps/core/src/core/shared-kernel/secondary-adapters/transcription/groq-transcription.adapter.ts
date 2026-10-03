import { Logger } from '@nestjs/common';
import Groq, { RateLimitError, toFile } from 'groq-sdk';
import {
  TranscriptionResult,
  TranscriptionServiceInterface,
} from '../../ports/transcription-service.interface';
import { S3ServiceInterface } from '../../ports/s3-service.interface';
import { compressAudioForTranscription } from './compress-audio.util';
import {
  mapWhisperVerboseJson,
  WhisperVerboseJson,
} from './whisper-verbose-json.mapper';

const MODEL = 'whisper-large-v3';
// Groq upload limit is 25 MB; bigger files are re-encoded with ffmpeg first
const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;
const MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 2_000;
// Do not block the request for long waits (e.g. daily quota exhausted)
const MAX_RETRY_DELAY_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// retry-after is either seconds or an HTTP date
const parseRetryAfterMs = (headers?: Headers): number | null => {
  const retryAfterMs = Number(headers?.get('retry-after-ms'));
  if (retryAfterMs > 0) {
    return retryAfterMs;
  }

  const retryAfter = headers?.get('retry-after');
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const date = Date.parse(retryAfter);
  return Number.isNaN(date) ? null : Math.max(date - Date.now(), 0);
};

export class GroqTranscriptionAdapter implements TranscriptionServiceInterface {
  private readonly logger = new Logger(GroqTranscriptionAdapter.name);
  private readonly groq: Groq;

  constructor(
    apiKey: string,
    private readonly s3Service: S3ServiceInterface,
  ) {
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is required for TRANSCRIPTION_PROVIDER=groq',
      );
    }

    // retries on 429 are handled here to honour retry-after with our limits
    this.groq = new Groq({ apiKey, maxRetries: 0 });
  }

  async transcribe(fileKey: string): Promise<TranscriptionResult> {
    let audio = await this.s3Service.getFile(fileKey);
    let fileName = fileKey.split('/').at(-1);

    if (audio.length > MAX_UPLOAD_BYTES) {
      const originalSize = audio.length;
      audio = await compressAudioForTranscription(audio);
      fileName = `${fileName.replace(/\.[^.]+$/, '')}.mp3`;
      this.logger.log(
        `Compressed ${fileKey} for transcription: ${originalSize} -> ${audio.length} bytes`,
      );
    }

    const raw = await this.requestWithRetry(audio, fileName);

    return mapWhisperVerboseJson(raw);
  }

  private async requestWithRetry(
    audio: Buffer,
    fileName: string,
  ): Promise<WhisperVerboseJson> {
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await this.groq.audio.transcriptions.create({
          file: await toFile(audio, fileName),
          model: MODEL,
          response_format: 'verbose_json',
          temperature: 0,
        });

        return response as WhisperVerboseJson;
      } catch (err) {
        if (!(err instanceof RateLimitError) || attempt >= MAX_ATTEMPTS) {
          throw err;
        }

        const delayMs =
          parseRetryAfterMs(err.headers) ?? DEFAULT_RETRY_DELAY_MS * attempt;
        if (delayMs > MAX_RETRY_DELAY_MS) {
          throw err;
        }

        this.logger.warn(
          `Groq rate limit (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delayMs} ms`,
        );
        await sleep(delayMs);
      }
    }
  }
}
