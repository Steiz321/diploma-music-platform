import { AnalysisInput, AnalysisOutput, Analyzer } from './analyzer';
import { stanzaSegmentIndexes } from './build-lyrics.util';

/**
 * Deterministic analysis without network: stanzas by pauses, a repeated
 * stanza becomes the chorus, fixed tags. For local development and tests.
 */
export class FakeAnalyzer implements Analyzer {
  readonly model = 'fake';

  constructor(private readonly delayMs: number) {}

  async analyze({ transcription }: AnalysisInput): Promise<AnalysisOutput> {
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
        mood: ['melancholic', 'hopeful'],
        topics: ['love', 'friendship'],
        energy: 'medium',
      },
    };
  }
}
