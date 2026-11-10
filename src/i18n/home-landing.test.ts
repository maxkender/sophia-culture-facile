import { describe, expect, it } from "vitest";
import copy from "./home-landing.json";
import { SLIDESHOW_LANGUAGES } from "./slideshow-pages";

describe("home landing languages", () => {
  it("has copy for exactly the slideshow languages", () => {
    expect(Object.keys(copy).sort()).toEqual(SLIDESHOW_LANGUAGES.map((l) => l.code).sort());
  });
  it("every language has 3 steps", () => {
    for (const c of Object.values(copy)) expect(c.steps).toHaveLength(3);
  });
});
