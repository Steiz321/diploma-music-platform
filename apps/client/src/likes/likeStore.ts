/**
 * Likes toggled in this session, shared by every view of a song (cards,
 * player, song page), so a heart clicked in one place updates all of them.
 * Songs that were not toggled show the value the server sent last: views
 * keep copies of songs (cached lists, the player queue) that go stale.
 */
type Listener = () => void;

const overrides = new Map<number, boolean>();
const pending = new Set<number>();
const listeners = new Set<Listener>();
// a new snapshot on every change, for useSyncExternalStore
let version = 0;

const emit = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

export const likeStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  version: () => version,

  /** the toggled value, or the server's when the song was not toggled */
  isLiked: (songId: number, serverValue: boolean) =>
    overrides.get(songId) ?? serverValue,

  isPending: (songId: number) => pending.has(songId),

  /**
   * Runs the request (the API toggles the like) and flips the stored value
   * once it succeeds. Ignored while a toggle of the same song is running.
   */
  async toggle(
    songId: number,
    serverValue: boolean,
    request: () => Promise<void>
  ) {
    if (pending.has(songId)) return;
    const next = !likeStore.isLiked(songId, serverValue);
    pending.add(songId);
    emit();
    try {
      await request();
      overrides.set(songId, next);
    } finally {
      pending.delete(songId);
      emit();
    }
  },

  /** for tests */
  reset() {
    overrides.clear();
    pending.clear();
    emit();
  },
};
