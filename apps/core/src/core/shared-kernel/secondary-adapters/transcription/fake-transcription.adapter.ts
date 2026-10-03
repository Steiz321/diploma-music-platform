import { readFile } from 'fs/promises';
import { resolve } from 'path';
import {
  TranscriptionResult,
  TranscriptionServiceInterface,
} from '../../ports/transcription-service.interface';
import {
  mapWhisperVerboseJson,
  WhisperVerboseJson,
} from './whisper-verbose-json.mapper';

// apps/core/fixtures: the same relative path works from src/ and dist/
const FIXTURE_PATH = resolve(
  __dirname,
  '../../../../..',
  'fixtures/transcription.json',
);

// Returns a recorded Groq response for any file, after a configurable delay.
// Used for local development and tests without spending API quota.
export class FakeTranscriptionAdapter implements TranscriptionServiceInterface {
  constructor(private readonly delayMs: number) {}

  async transcribe(_fileKey: string): Promise<TranscriptionResult> {
    const raw: WhisperVerboseJson = JSON.parse(
      await readFile(FIXTURE_PATH, 'utf8'),
    );

    if (this.delayMs > 0) {
      await new Promise((done) => setTimeout(done, this.delayMs));
    }

    return mapWhisperVerboseJson(raw);
  }
}
