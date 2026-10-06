import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { average, listMetrics } from './metrics.ts';
import { affinity, PERSONAS } from './personas.ts';

describe('listMetrics', () => {
  it('counts hits in the top k', () => {
    assert.deepEqual(listMetrics([1, 2, 3, 4, 5, 6], new Set([2, 6, 9]), 5), {
      hit: 1,
      precision: 1 / 5,
      recall: 1 / 3,
    });
  });

  it('is zero without hits and counts a short list as k slots', () => {
    assert.deepEqual(listMetrics([7], new Set([1]), 5), { hit: 0, precision: 0, recall: 0 });
    assert.equal(listMetrics([1], new Set([1]), 5).precision, 0.2);
  });

  it('averages over users', () => {
    assert.deepEqual(
      average([
        { hit: 1, precision: 0.4, recall: 0.5 },
        { hit: 0, precision: 0, recall: 0 },
      ]),
      { hit: 0.5, precision: 0.2, recall: 0.25 },
    );
  });
});

describe('affinity', () => {
  it('is liked tags minus disliked tags', () => {
    const melancholic = PERSONAS.find((p) => p.name === 'melancholic')!;
    assert.equal(
      affinity(melancholic, { mood: ['sad', 'happy'], topics: ['memories', 'war'], energy: 'low', language: 'en' }),
      1 + 1 - 1,
    );
  });
});
