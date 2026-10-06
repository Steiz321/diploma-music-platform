import { createEnvelope } from '@platform/contracts';
import { isSongEnrichmentEvent } from './song-enrichment.consumer';

const failed = (producer: string) =>
  createEnvelope(
    'song.enrichment_failed',
    { song_id: 42, stage: 'transcription', reason: 'x', attempts: 1 },
    { producer },
  );

describe('SongEnrichmentConsumer', () => {
  it('accepts results only from the AI enrichment service', () => {
    expect(isSongEnrichmentEvent(failed('ai-enrichment'))).toBe(true);
    expect(isSongEnrichmentEvent(failed('core'))).toBe(false);
    expect(isSongEnrichmentEvent(failed('manual-test'))).toBe(false);
  });
});
