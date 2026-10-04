import { AsyncLocalStorage } from 'node:async_hooks';
import { EventEnvelope } from '@platform/contracts';

interface RequestContextStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

/**
 * Per-request (or per-message) values available anywhere down the call chain.
 * requestId becomes correlation_id of the events produced in this context.
 */
export const RequestContext = {
  run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  },

  /** id of the current HTTP request or consumed event chain */
  requestId(): string | undefined {
    return storage.getStore()?.requestId;
  },
};

/**
 * Runs a message handler in the context of the consumed event, so the events
 * it produces and its logs carry the same correlation_id.
 */
export const withEventContext = <T>(
  envelope: EventEnvelope,
  handler: () => T,
): T =>
  RequestContext.run(
    { requestId: envelope.correlation_id ?? envelope.event_id },
    handler,
  );
