import { beforeEach, describe, expect, it, vi } from "vitest";
import { likeStore } from "./likeStore";

const ok = () => Promise.resolve();

describe("likeStore", () => {
  beforeEach(() => likeStore.reset());

  it("shows the server value until the song is toggled", () => {
    expect(likeStore.isLiked(1, true)).toBe(true);
    expect(likeStore.isLiked(1, false)).toBe(false);
  });

  it("flips the value after a successful toggle, for every view", async () => {
    await likeStore.toggle(1, false, ok);
    // a stale copy of the song (is_liked: false) sees the like too
    expect(likeStore.isLiked(1, false)).toBe(true);
    expect(likeStore.isLiked(1, true)).toBe(true);

    await likeStore.toggle(1, false, ok);
    expect(likeStore.isLiked(1, true)).toBe(false);
  });

  it("keeps the value when the request fails", async () => {
    await expect(
      likeStore.toggle(1, false, () => Promise.reject(new Error("down")))
    ).rejects.toThrow("down");
    expect(likeStore.isLiked(1, false)).toBe(false);
    expect(likeStore.isPending(1)).toBe(false);
  });

  it("ignores a second toggle while the first is running", async () => {
    const request = vi.fn(ok);
    const first = likeStore.toggle(1, false, request);
    expect(likeStore.isPending(1)).toBe(true);
    await likeStore.toggle(1, false, request);
    await first;
    expect(request).toHaveBeenCalledTimes(1);
    expect(likeStore.isLiked(1, false)).toBe(true);
  });

  it("notifies subscribers", async () => {
    const listener = vi.fn();
    const unsubscribe = likeStore.subscribe(listener);
    await likeStore.toggle(2, false, ok);
    unsubscribe();
    expect(listener).toHaveBeenCalled();
  });
});
