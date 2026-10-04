import { Logger } from '@nestjs/common';
import Groq, { toFile } from 'groq-sdk';
import { TranscriptionResult } from '@platform/contracts';
import { Transcriber } from './transcriber';
import { compressAudioForTranscription } from './compress-audio.util';
import {
  mapWhisperVerboseJson,
  WhisperVerboseJson,
} from './whisper-verbose-json.mapper';
import { groqRetry, withRetry } from '../common/retry.util';

const MODEL = 'whisper-large-v3';
// Groq upload limit is 25 MB; bigger files are re-encoded with ffmpeg first
const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;

export class GroqTranscriber implements Transcriber {
  readonly model = MODEL;
  private readonly logger = new Logger(GroqTranscriber.name);
  private readonly groq: Groq;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is required for TRANSCRIPTION_PROVIDER=groq',
      );
    }

    // retries are handled by withRetry to honour retry-after with our limits
    this.groq = new Groq({ apiKey, maxRetries: 0 });
  }

  async transcribe(
    audio: Buffer,
    fileName: string,
  ): Promise<TranscriptionResult> {
    if (audio.length > MAX_UPLOAD_BYTES) {
      const originalSize = audio.length;
      audio = await compressAudioForTranscription(audio);
      fileName = `${fileName.replace(/\.[^.]+$/, '')}.mp3`;
      this.logger.log(
        `Compressed ${fileName} for transcription: ${originalSize} -> ${audio.length} bytes`,
      );
    }

    const raw = await withRetry(
      async () =>
        (await this.groq.audio.transcriptions.create({
          file: await toFile(audio, fileName),
          model: MODEL,
          response_format: 'verbose_json',
          temperature: 0,
        })) as WhisperVerboseJson,
      groqRetry('Groq transcription', this.logger),
    );

    return mapWhisperVerboseJson(raw);
  }
}
