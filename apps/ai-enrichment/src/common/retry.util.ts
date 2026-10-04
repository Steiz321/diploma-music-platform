import { Logger } from '@nestjs/common';
import {
  APIConnectionError,
  InternalServerError,
  RateLimitError,
} from 'groq-sdk';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The operation failed for good; `attempts` is how many tries were made. */
export class RetryExhaustedError extends Error {
  constructor(
    readonly attempts: number,
    readonly cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'RetryExhaustedError';
  }
}

export interface RetryOptions {
  label: string;
  attempts: number;
  /** delay before the 2nd attempt, doubled for every next one */
  baseDelayMs: number;
  /** a longer wait (e.g. daily quota exhausted) is not worth blocking on */
  maxDelayMs: number;
  /** which errors are worth another attempt */
  isRetryable: (err: unknown) => boolean;
  /** server-provided delay, e.g. retry-after of a 429 */
  delayFor?: (err: unknown) => number | null;
  logger?: Logger;
}

/** Runs `operation` until it succeeds or attempts/delays run out. */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt >= options.attempts || !options.isRetryable(err)) {
        throw new RetryExhaustedError(attempt, err);
      }

      const delayMs =
        options.delayFor?.(err) ?? options.baseDelayMs * 2 ** (attempt - 1);
      if (delayMs > options.maxDelayMs) {
        throw new RetryExhaustedError(attempt, err);
      }

      options.logger?.warn(
        `${options.label} failed (attempt ${attempt}/${options.attempts}): ${
          err instanceof Error ? err.message : err
        }; retrying in ${delayMs} ms`,
      );
      await sleep(delayMs);
    }
  }
};

// retry-after is either seconds or an HTTP date
const parseRetryAfterMs = (headers?: Headers): number | null => {
  const retryAfterMs = Number(headers?.get('retry-after-ms'));
  if (retryAfterMs > 0) {
    return retryAfterMs;
  }

  const retryAfter = headers?.get('retry-after');
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const date = Date.parse(retryAfter);
  return Number.isNaN(date) ? null : Math.max(date - Date.now(), 0);
};

/** Retry policy for Groq API calls: 429 (honouring retry-after), network, 5xx. */
export const groqRetry = (
  label: string,
  logger: Logger,
): Omit<RetryOptions, 'label'> & { label: string } => ({
  label,
  logger,
  attempts: 3,
  baseDelayMs: 2_000,
  maxDelayMs: 60_000,
  isRetryable: (err) =>
    err instanceof RateLimitError ||
    err instanceof APIConnectionError ||
    err instanceof InternalServerError,
  delayFor: (err) =>
    err instanceof RateLimitError ? parseRetryAfterMs(err.headers) : null,
});
