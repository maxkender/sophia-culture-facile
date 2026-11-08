import { describe, expect, it } from "vitest";
import { readAttribution } from "./onboarding-events";
import { buildPlan } from "@/config/onboarding";

describe("start funnel", () => {
  it("reads ?src= from the URL", () => {
    expect(readAttribution("?src=tiktok_ad1&x=1")).toEqual({ src: "tiktok_ad1" });
  });
  it("builds a 4-week plan cycling through interests", () => {
    expect(buildPlan(["art", "music"])).toEqual(["art", "music", "art", "music"]);
  });
});
