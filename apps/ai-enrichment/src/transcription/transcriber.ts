import { TranscriptionResult } from '@platform/contracts';

export interface Transcriber {
  /** model name recorded in song.enriched */
  readonly model: string;

  transcribe(audio: Buffer, fileName: string): Promise<TranscriptionResult>;
}

export const TranscriberType = Symbol.for('Transcriber');
