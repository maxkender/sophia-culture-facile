import { describe, it, expect } from "vitest";
import { joinRedirectFor } from "./slideshow-pages";
describe("join redirect", () => {
  it("keeps lang and query", () => expect(joinRedirectFor("/pl/creators/slideshow", "?utm_source=meta&fbclid=abc")).toBe("https://join.vikstudios.com/?lang=pl&utm_source=meta&fbclid=abc"));
  it("french apply", () => expect(joinRedirectFor("/fr/candidature-slideshow", "?ref=X")).toBe("https://join.vikstudios.com/?lang=fr&ref=X"));
  it("no lang", () => expect(joinRedirectFor("/creators/slideshow/apply", "")).toBe("https://join.vikstudios.com/"));
  it("signing untouched", () => expect(joinRedirectFor("/creators/sign/abc", "")).toBeNull());
});
