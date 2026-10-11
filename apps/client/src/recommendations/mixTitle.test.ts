import { describe, expect, it } from "vitest";
import type { RecommendedSong, RecommendedSongs, SongTags } from "../api/song";
import {
  COLD_START_SUBTITLE,
  COLD_START_TITLE,
  describeMix,
  mixTitle,
  rankTags,
} from "./mixTitle";

let nextId = 1;
const song = (
  reasonTags: string[] | null,
  tags: Partial<SongTags> | null = null
): RecommendedSong =>
  ({
    id: nextId++,
    tags: tags && { mood: [], topics: [], energy: "", language: "", ...tags },
    reasons: reasonTags && {
      tags: reasonTags,
      similar_listeners: false,
      popular: false,
    },
  }) as unknown as RecommendedSong;

const result = (
  songs: RecommendedSong[],
  patch: Partial<RecommendedSongs> = {}
): RecommendedSongs => ({
  songs,
  source: "recommendations",
  cold_start: false,
  ...patch,
});

describe("mixTitle", () => {
  it("names the two most frequent moods", () => {
    expect(
      mixTitle([
        song(["mood:nostalgic", "topics:memories"]),
        song(["mood:calm", "mood:nostalgic"]),
        song(["mood:calm", "mood:dreamy"]),
        song(["mood:calm"]),
      ])
    ).toBe("Calm & nostalgic mix");
  });

  it("breaks ties by first appearance", () => {
    expect(
      mixTitle([song(["mood:dreamy", "mood:dark"]), song(["mood:hopeful"])])
    ).toBe("Dreamy & dark mix");
  });

  it("uses one mood, or none", () => {
    expect(mixTitle([song(["mood:calm", "energy:low"])])).toBe("Calm mix");
    expect(mixTitle([song(["topics:city_life"])])).toBe("Your mix");
    expect(mixTitle([])).toBe("Your mix");
  });

  it("falls back to the song's moods when reasons are missing", () => {
    expect(
      mixTitle([song(null, { mood: ["self_discovery"] }), song(null)])
    ).toBe("Self discovery mix");
  });
});

describe("rankTags", () => {
  it("counts a tag once per song", () => {
    expect(
      rankTags([song(["mood:calm", "mood:calm"]), song(["mood:sad"]), song(["mood:sad"])])
    ).toEqual(["mood:sad", "mood:calm"]);
  });
});

describe("describeMix", () => {
  it("explains a personal mix", () => {
    expect(
      describeMix(
        result([
          song(["mood:calm", "topics:memories"]),
          song(["mood:calm", "language:uk"]),
        ])
      )
    ).toEqual({
      title: "Calm mix",
      subtitle: "Because you like calm, memories and Ukrainian. 2 songs picked for you.",
      tags: ["mood:calm", "topics:memories", "language:uk"],
    });
  });

  it("does not invent reasons when there are none", () => {
    expect(describeMix(result([song([])])).subtitle).toBe(
      "1 song picked from what you listen to."
    );
  });

  it("shows popular songs on a cold start", () => {
    const cold = {
      title: COLD_START_TITLE,
      subtitle: COLD_START_SUBTITLE,
      tags: [],
    };
    expect(describeMix(result([song(["mood:calm"])], { source: "popular" }))).toEqual(cold);
    expect(describeMix(result([song(["mood:calm"])], { cold_start: true }))).toEqual(cold);
  });
});
