import { TAG_VOCABULARY } from '@platform/contracts';
import { AnalysisInput, AnalysisOutput, Analyzer } from './analyzer';
import { stanzaSegmentIndexes } from './build-lyrics.util';

// FNV-1a: a stable number from the title
const hashOf = (text: string): number => {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

const pickTwo = <T>(values: readonly T[], hash: number): T[] => {
  const first = hash % values.length;
  const second =
    (first + 1 + ((hash >>> 8) % (values.length - 1))) % values.length;
  return [values[first], values[second]];
};

/**
 * Deterministic analysis without network: stanzas by pauses, a repeated
 * stanza becomes the chorus. Tags are derived from the title, so different
 * songs get different (but stable) tags and profiles / recommendations can
 * be demonstrated offline. For local development and tests.
 */
export class FakeAnalyzer implements Analyzer {
  readonly model = 'fake';

  constructor(private readonly delayMs: number) {}

  async analyze({
    title,
    transcription,
  }: AnalysisInput): Promise<AnalysisOutput> {
    if (this.delayMs > 0) {
      await new Promise((done) => setTimeout(done, this.delayMs));
    }

    const { segments } = transcription;
    const stanzas = stanzaSegmentIndexes(segments);
    const key = (stanza: number[]) =>
      stanza
        .map((index) => segments[index].text.trim().toLowerCase())
        .join('|');
    const counts = new Map<string, number>();
    stanzas.forEach((stanza) =>
      counts.set(key(stanza), (counts.get(key(stanza)) ?? 0) + 1),
    );

    return {
      instrumental: stanzas.length === 0,
      verses: stanzas.map((stanza) => ({
        kind: counts.get(key(stanza)) > 1 ? 'chorus' : 'verse',
        lines: stanza.map((index) => ({
          segment: index,
          text: segments[index].text.trim(),
        })),
      })),
      tags: {
        mood: pickTwo(TAG_VOCABULARY.mood, hashOf(title)),
        topics: pickTwo(TAG_VOCABULARY.topics, hashOf(`${title}#topics`)),
        energy:
          TAG_VOCABULARY.energy[
            hashOf(`${title}#energy`) % TAG_VOCABULARY.energy.length
          ],
      },
    };
  }
}
