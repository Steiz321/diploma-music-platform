/** One Whisper segment: roughly one line of the lyrics. */
export interface TranscriptionSegment {
  /** seconds from the start of the track */
  start: number;
  end: number;
  text: string;
  avgLogprob: number;
  noSpeechProb: number;
}

export interface TranscriptionResult {
  /** raw text as returned by the provider */
  text: string;
  /** ISO-639-1 code when known (e.g. "en"), otherwise the provider's value */
  language: string | null;
  /** audio duration, seconds */
  duration: number | null;
  segments: TranscriptionSegment[];
}
