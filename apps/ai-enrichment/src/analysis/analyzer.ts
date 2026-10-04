import { TranscriptionResult } from '@platform/contracts';

export interface AnalysisInput {
  title: string;
  transcription: TranscriptionResult;
}

/**
 * Raw answer of the model. Lines refer to Whisper segments by index, so
 * timings come from the transcription and cannot be invented by the model.
 * Validated by analysis.mapper before use.
 */
export interface AnalysisOutput {
  instrumental: boolean;
  verses: {
    kind: string;
    lines: { segment: number; text: string }[];
  }[];
  tags: {
    mood: string[];
    topics: string[];
    energy: string;
  };
}

export interface Analyzer {
  /** model name recorded in song.enriched */
  readonly model: string;

  analyze(input: AnalysisInput): Promise<AnalysisOutput>;
}

export const AnalyzerType = Symbol.for('Analyzer');
