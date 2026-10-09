import { describe, expect, it } from "vitest";
import { describeReasons, tagLabel } from "./reasons";

const reasons = (patch = {}) => ({
  tags: [],
  similar_listeners: false,
  popular: false,
  ...patch,
});

describe("describeReasons", () => {
  it("names the liked tags", () => {
    expect(
      describeReasons(
        reasons({ tags: ["mood:melancholic", "topics:self_discovery"] }),
        "for-you"
      )
    ).toBe("Because you like melancholic, self discovery");
    expect(describeReasons(reasons({ tags: ["energy:low"] }), "similar")).toBe(
      "Also low energy"
    );
  });

  it("falls back to similar listeners, then popularity", () => {
    expect(
      describeReasons(reasons({ similar_listeners: true }), "for-you")
    ).toBe("Liked by listeners with a similar taste");
    expect(describeReasons(reasons({ popular: true }), "for-you")).toBe(
      "Popular right now"
    );
    expect(describeReasons(null, "similar")).toBe("Popular right now");
  });

  it("does not call a track popular without a reason to", () => {
    expect(describeReasons(reasons(), "for-you")).toBe("Something new to try");
    expect(describeReasons(reasons(), "similar")).toBe("You might also like");
  });
});

describe("tagLabel", () => {
  it("reads like plain words", () => {
    expect(tagLabel("language:uk")).toBe("Ukrainian");
    expect(tagLabel("topics:city_life")).toBe("city life");
  });
});
