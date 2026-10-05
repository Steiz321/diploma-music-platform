// Batched player-event tracker (no third-party analytics SDK).
//
// Events are queued and sent to POST /events in batches: every few seconds,
// as soon as enough are collected, and right away when the tab is hidden or
// closed. Every request uses fetch(..., { keepalive: true }), so it is not
// cancelled when the page goes away (a batch is far below the 64 KB keepalive
// limit). navigator.sendBeacon is not used: it cannot send the Authorization
// header.

export type PlaybackEventType =
  | "playback.started"
  | "playback.progress"
  | "playback.paused"
  | "playback.resumed"
  | "playback.seeked"
  | "playback.completed"
  | "playback.skipped";

export interface PlaybackSource {
  type: "feed" | "playlist" | "profile" | "liked" | "song_page" | "recommendations";
  id?: number;
}

export interface PlaybackEvent {
  event_id: string;
  type: PlaybackEventType;
  occurred_at: string;
  play_id: string;
  song_id: number;
  position_sec: number;
  duration_sec: number | null;
  source: PlaybackSource;
  from_sec?: number;
  to_sec?: number;
}

export type TrackInput = Omit<PlaybackEvent, "event_id" | "occurred_at">;

/** Sends one batch; returns the HTTP status (0 when the request failed). */
export type SendBatch = (events: PlaybackEvent[]) => Promise<number>;

export interface TrackerOptions {
  send: SendBatch;
  flushIntervalMs?: number;
  /** flush as soon as this many events are queued */
  batchSize?: number;
  /** server limit per request */
  maxBatchSize?: number;
  /** oldest events are dropped above this (e.g. offline for a long time) */
  maxQueueSize?: number;
  now?: () => Date;
  newId?: () => string;
}

export class Tracker {
  private queue: PlaybackEvent[] = [];
  private flushing = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly send: SendBatch;
  private readonly flushIntervalMs: number;
  private readonly batchSize: number;
  private readonly maxBatchSize: number;
  private readonly maxQueueSize: number;
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(options: TrackerOptions) {
    this.send = options.send;
    this.flushIntervalMs = options.flushIntervalMs ?? 10_000;
    this.batchSize = options.batchSize ?? 20;
    this.maxBatchSize = options.maxBatchSize ?? 50;
    this.maxQueueSize = options.maxQueueSize ?? 200;
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? (() => crypto.randomUUID());
  }

  /** Starts periodic flushing and flushing when the page is hidden. */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pagehide", this.onPageHide);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pagehide", this.onPageHide);
  }

  track(event: TrackInput): void {
    this.queue.push({
      ...event,
      event_id: this.newId(),
      occurred_at: this.now().toISOString(),
    });
    this.trimQueue();

    if (this.queue.length >= this.batchSize) {
      void this.flush();
    }
  }

  get pending(): number {
    return this.queue.length;
  }

  /**
   * Sends queued events in batches of maxBatchSize. A batch that fails
   * (network, 429, 5xx) goes back to the queue; 4xx other than 429 means the
   * batch will never be accepted (bad data, expired session), so it is dropped.
   */
  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.maxBatchSize);
        const status = await this.send(batch);

        if (status === 0 || status === 429 || status >= 500) {
          // keep the order: the failed batch goes before newer events
          this.queue.unshift(...batch);
          this.trimQueue();
          return;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private trimQueue(): void {
    if (this.queue.length > this.maxQueueSize) {
      this.queue.splice(0, this.queue.length - this.maxQueueSize);
    }
  }

  private onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      void this.flush();
    }
  };

  private onPageHide = () => {
    void this.flush();
  };
}

/** POST /events with the session token. */
export const createHttpSender =
  (apiUrl: string, getToken: () => string | null): SendBatch =>
  async (events) => {
    const token = getToken();
    if (!token) return 401;

    try {
      const response = await fetch(`${apiUrl}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
      return response.status;
    } catch {
      return 0;
    }
  };
