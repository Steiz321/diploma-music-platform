import { TAG_VOCABULARY, VERSE_KINDS } from '@platform/contracts';

/**
 * JSON schema for Groq structured outputs in strict mode: the model can only
 * answer with this shape, and tags only with values of the vocabulary.
 * Strict mode needs every field required and additionalProperties: false;
 * item counts (1–3 tags) are checked by analysis.mapper.
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
          kind: { type: 'string', enum: [...VERSE_KINDS] },
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
        mood: {
          type: 'array',
          items: { type: 'string', enum: [...TAG_VOCABULARY.mood] },
        },
        topics: {
          type: 'array',
          items: { type: 'string', enum: [...TAG_VOCABULARY.topics] },
        },
        energy: { type: 'string', enum: [...TAG_VOCABULARY.energy] },
      },
    },
  },
} as const;
