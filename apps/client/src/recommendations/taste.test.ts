import { describe, expect, it } from "vitest";
import type { UserTaste } from "../api/user";
import { describeTaste, toPercents } from "./taste";

const pref = (key: string, value: number) => ({ key, value });

const taste = (patch: Partial<UserTaste> = {}): UserTaste => ({
  moods: [],
  topics: [],
  ...patch,
});

describe("toPercents", () => {
  it("adds up to 100 by giving leftovers to the largest remainders", () => {
    expect(toPercents([1, 1, 1])).toEqual([34, 33, 33]);
    expect(toPercents([2, 1])).toEqual([67, 33]);
  });

  it("is all zeros when there is nothing to count", () => {
    expect(toPercents([0, 0])).toEqual([0, 0]);
  });
});

describe("describeTaste", () => {
  it("labels the moods and shows their shares, adding up to 100", () => {
    const summary = describeTaste(
      taste({
        moods: [
          pref("mood:calm", 0.42),
          pref("mood:nostalgic", 0.33),
          pref("mood:dreamy", 0.25),
        ],
      })
    );
    expect(summary?.moods).toEqual([
      { key: "mood:calm", label: "calm", percent: 42 },
      { key: "mood:nostalgic", label: "nostalgic", percent: 33 },
      { key: "mood:dreamy", label: "dreamy", percent: 25 },
    ]);
  });

  it("labels the topics", () => {
    const summary = describeTaste(
      taste({
        moods: [pref("mood:calm", 0.6), pref("mood:dreamy", 0.4)],
        topics: [pref("topics:city_life", 0.5), pref("topics:memories", 0.2)],
      })
    );
    expect(summary?.topics).toEqual(["city life", "memories"]);
  });

  it("is null without a profile", () => {
    expect(describeTaste(null)).toBeNull();
  });

  it("is null with fewer than two moods", () => {
    expect(
      describeTaste(taste({ moods: [pref("mood:calm", 1)] }))
    ).toBeNull();
  });
});
