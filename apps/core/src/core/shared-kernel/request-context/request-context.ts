import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

/** Per-request values available anywhere down the call chain of a request. */
export const RequestContext = {
  run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  },

  /** id of the current HTTP request; undefined outside of a request */
  requestId(): string | undefined {
    return storage.getStore()?.requestId;
  },
};
