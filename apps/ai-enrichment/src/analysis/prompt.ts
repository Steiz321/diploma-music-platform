import { TAG_LIMITS } from '@platform/contracts';
import { AnalysisInput } from './analyzer';

export const SYSTEM_PROMPT = `You analyse song lyrics transcribed by Whisper.

Input: the song title and the numbered Whisper segments (i) with timings in
seconds and quality hints (avg_logprob, no_speech_prob).

1. Structure. Group the lyric lines into verses and set each verse kind
   (verse, chorus, bridge, intro, outro, other). A repeated block is usually
   the chorus. Every line refers to the segment it comes from by "segment"
   (the i of the input); a segment may be split into several lines.
2. Clean up. Leave out Whisper artifacts: music symbols like "🎵", captions
   like "guitar solo" or "[Music]", "Thanks for watching", and hallucinations
   on silence (very short isolated lines with low avg_logprob, e.g. a lone
   "you" at the end). Keep the original language and wording: do not
   translate, fix only obvious misspellings.
3. Tags. Describe what the lyrics are about: ${TAG_LIMITS.mood.min}-${TAG_LIMITS.mood.max} moods,
   ${TAG_LIMITS.topics.min}-${TAG_LIMITS.topics.max} topics, one energy level. Use only the allowed values.
4. instrumental = true when there are no real lyrics (only artifacts); then
   return an empty verses list.`;

const round = (value: number, digits: number) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

/** User message: compact JSON to keep within Groq token limits. */
export const buildAnalysisRequest = ({
  title,
  transcription,
}: AnalysisInput): string =>
  JSON.stringify({
    title,
    language: transcription.language,
    segments: transcription.segments.map((segment, i) => ({
      i,
      start: round(segment.start, 1),
      end: round(segment.end, 1),
      text: segment.text.trim(),
      avg_logprob: round(segment.avgLogprob, 2),
      no_speech_prob: round(segment.noSpeechProb, 2),
    })),
  });
