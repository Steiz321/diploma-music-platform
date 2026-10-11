import { describe, expect, it, vi } from "vitest";
import { PlaybackEvent, SendBatch, Tracker, TrackInput } from "./tracker";

const input = (songId = 1): TrackInput => ({
  type: "playback.progress",
  play_id: "play-1",
  song_id: songId,
  position_sec: 15,
  duration_sec: 200,
  source: { type: "feed" },
});

const setup = (statuses: number[] = [], options = {}) => {
  const sent: PlaybackEvent[][] = [];
  const send = vi.fn<SendBatch>(async (events) => {
    sent.push(events);
    return statuses.shift() ?? 202;
  });
  let id = 0;
  const tracker = new Tracker({
    send,
    now: () => new Date("2026-10-05T10:00:00.000Z"),
    newId: () => `id-${++id}`,
    ...options,
  });
  return { tracker, send, sent };
};

describe("Tracker", () => {
  it("adds an id and the client time to every event", async () => {
    const { tracker, sent } = setup();

    tracker.track(input(7));
    await tracker.flush();

    expect(sent).toEqual([
      [
        {
          ...input(7),
          event_id: "id-1",
          occurred_at: "2026-10-05T10:00:00.000Z",
        },
      ],
    ]);
    expect(tracker.pending).toBe(0);
  });

  it("flushes on its own once the batch size is reached", async () => {
    const { tracker, send } = setup([], { batchSize: 3 });

    tracker.track(input());
    tracker.track(input());
    expect(send).not.toHaveBeenCalled();

    tracker.track(input());
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });

  it("splits a long queue into batches the server accepts", async () => {
    const { tracker, sent } = setup([], { batchSize: 1000, maxBatchSize: 50 });

    for (let i = 0; i < 120; i++) tracker.track(input(i + 1));
    await tracker.flush();

    expect(sent.map((batch) => batch.length)).toEqual([50, 50, 20]);
  });

  it.each([0, 429, 503])(
    "keeps a batch that failed with %i and retries it first, in order",
    async (status) => {
      const { tracker, sent } = setup([status]);

      tracker.track(input(1));
      await tracker.flush();
      tracker.track(input(2));
      await tracker.flush();

      expect(sent).toHaveLength(2);
      expect(sent[1].map((event) => event.song_id)).toEqual([1, 2]);
      // the retry reuses the same event ids: the server stores them once
      expect(sent[1][0].event_id).toBe(sent[0][0].event_id);
      expect(tracker.pending).toBe(0);
    }
  );

  it.each([400, 401])(
    "drops a batch rejected with %i (it would never be accepted)",
    async (status) => {
      const { tracker } = setup([status]);

      tracker.track(input());
      await tracker.flush();

      expect(tracker.pending).toBe(0);
    }
  );

  it("drops the oldest events above the queue limit", async () => {
    const { tracker, sent } = setup([], { batchSize: 1000, maxQueueSize: 3 });

    for (let i = 1; i <= 5; i++) tracker.track(input(i));
    await tracker.flush();

    expect(sent[0].map((event) => event.song_id)).toEqual([3, 4, 5]);
  });

  it("does not run two flushes at the same time", async () => {
    const { tracker, send } = setup();

    tracker.track(input());
    await Promise.all([tracker.flush(), tracker.flush()]);

    expect(send).toHaveBeenCalledTimes(1);
  });
});
