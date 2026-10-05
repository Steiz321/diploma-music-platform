import { ThrottlerOptions } from '@nestjs/throttler';

/**
 * Named rate limits. ThrottlerModule is global, so all of them are declared
 * once; every rate-limited route skips the limits that are not its own.
 */
export const THROTTLERS = {
  // POST /song/:id/listen: one counted listen per user–song pair per 30 s
  listen: { name: 'listen', ttl: 30_000, limit: 1 },
  // POST /events: player event batches per user
  events: { name: 'events', ttl: 60_000, limit: 30 },
} satisfies Record<string, ThrottlerOptions>;
