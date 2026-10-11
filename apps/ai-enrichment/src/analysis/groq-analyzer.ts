import { Logger } from '@nestjs/common';
import Groq, { BadRequestError } from 'groq-sdk';
import { AnalysisInput, AnalysisOutput, Analyzer } from './analyzer';
import { ANALYSIS_SCHEMA } from './analysis-schema';
import { InvalidAnalysisError } from './analysis.mapper';
import { buildAnalysisRequest, SYSTEM_PROMPT } from './prompt';
import { groqRetry, withRetry } from '../common/retry.util';

const MODEL = 'openai/gpt-oss-120b';

/** Groq generated an answer that does not match the JSON schema. */
const isSchemaMismatch = (err: unknown): boolean =>
  err instanceof BadRequestError &&
  err.message.includes('json_validate_failed');

export class GroqAnalyzer implements Analyzer {
  readonly model = MODEL;
  private readonly logger = new Logger(GroqAnalyzer.name);
  private readonly groq: Groq;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required for LLM_PROVIDER=groq');
    }
    this.groq = new Groq({ apiKey, maxRetries: 0 });
  }

  async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const completion = await this.complete(input).catch((err) => {
      // an unusable answer: the service may ask once more
      throw isSchemaMismatch(err)
        ? new InvalidAnalysisError(
            `answer does not match the schema: ${err.message}`,
          )
        : err;
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error(
        `Empty LLM response (finish_reason: ${completion.choices[0]?.finish_reason})`,
      );
    }

    return JSON.parse(content) as AnalysisOutput;
  }

  private complete(input: AnalysisInput) {
    return withRetry(
      () =>
        this.groq.chat.completions.create({
          model: MODEL,
          temperature: 0,
          // the task is mostly mechanical; low effort saves tokens/minute
          reasoning_effort: 'low',
          max_completion_tokens: 8192,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildAnalysisRequest(input) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'song_analysis',
              strict: true,
              schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
            },
          },
        }),
      groqRetry('Groq analysis', this.logger),
    );
  }
}
