import { describe, expect, it } from "vitest";
import { readAttribution } from "./onboarding-events";
import { buildSwipeDeck, screenYears } from "@/config/onboarding";

describe("start funnel", () => {
  it("reads ?src= from the URL", () => {
    expect(readAttribution("?src=tiktok_ad1&x=1")).toEqual({ src: "tiktok_ad1" });
  });
  it("computes screen years per spec: round(80 × minutes / 1440), clamped 1…26", () => {
    expect(screenYears(180)).toBe(10);
    expect(screenYears(30)).toBe(2);
    expect(screenYears(600)).toBe(26);
    expect(screenYears(1)).toBe(1);
  });
  it("builds a 6-card swipe deck with 2 cards from the chosen topics", () => {
    const deck = buildSwipeDeck(["history", "science"]);
    expect(deck).toHaveLength(6);
    expect(deck.slice(4).every((c) => ["History", "Science"].includes(c.subject))).toBe(true);
    expect(new Set(deck.map((c) => c.id)).size).toBe(6);
  });
});
