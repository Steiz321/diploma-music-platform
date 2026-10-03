export const EXCHANGES = {
  /** topic exchange for all domain events, routing key = event type */
  events: 'platform.events',
  /** topic exchange for dead-letter queues of the consumers */
  deadLetter: 'platform.dlx',
} as const;

export type ExchangeName = (typeof EXCHANGES)[keyof typeof EXCHANGES];
