/**
 * JSON schema for Groq structured outputs in strict mode: the shape of the
 * answer. Strict mode needs every field required and additionalProperties:
 * false.
 *
 * Tag values and verse kinds are plain strings on purpose: Groq validates the
 * answer after generation and rejects all of it when one value is outside an
 * enum (e.g. an invented topic), losing the structure and the valid tags. The
 * allowed values are listed in the prompt; analysis.mapper keeps only values
 * of the vocabulary and checks the counts (1–3 tags).
 */
export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['instrumental', 'verses', 'tags'],
  properties: {
    instrumental: { type: 'boolean' },
    verses: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'lines'],
        properties: {
          kind: { type: 'string' },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['segment', 'text'],
              properties: {
                segment: { type: 'integer' },
                text: { type: 'string' },
              },
            },
          },
        },
      },
    },
    tags: {
      type: 'object',
      additionalProperties: false,
      required: ['mood', 'topics', 'energy'],
      properties: {
        mood: { type: 'array', items: { type: 'string' } },
        topics: { type: 'array', items: { type: 'string' } },
        energy: { type: 'string' },
      },
    },
  },
} as const;
