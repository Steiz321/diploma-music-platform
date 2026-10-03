import { TranscriptionResult } from '../../ports/transcription-service.interface';

// Shape of Whisper `verbose_json` responses (Groq / OpenAI-compatible)
export interface WhisperVerboseJson {
  text?: string;
  language?: string;
  duration?: number;
  segments?: {
    start: number;
    end: number;
    text: string;
    avg_logprob: number;
    no_speech_prob: number;
  }[];
}

// Whisper returns language names ("English"); only English is mapped for now,
// other values are stored lowercased as returned.
const LANGUAGE_CODES: Record<string, string> = {
  english: 'en',
};

export const normalizeLanguage = (language?: string): string | null => {
  if (!language) {
    return null;
  }

  const normalized = language.trim().toLowerCase();
  return LANGUAGE_CODES[normalized] ?? normalized;
};

export const mapWhisperVerboseJson = (
  raw: WhisperVerboseJson,
): TranscriptionResult => ({
  text: raw.text?.trim() ?? '',
  language: normalizeLanguage(raw.language),
  duration: raw.duration ?? null,
  segments: (raw.segments ?? []).map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: segment.text,
    avgLogprob: segment.avg_logprob,
    noSpeechProb: segment.no_speech_prob,
  })),
});
