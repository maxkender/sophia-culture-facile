import { describe, expect, it } from "vitest";
import { captureReferralCode, normalizeReferralCode, REFERRAL_STORAGE_KEY, REFERRAL_TTL_MS, withReferralCode } from "./slideshow-referral-code";

function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}
describe("OS referral attribution", () => {
  it("expires at exactly 30 days, not on unrelated visits", () => {
    const s = storage();
    expect(REFERRAL_TTL_MS).toBe(2_592_000_000);
    expect(captureReferralCode(s, " CODE-123 ", 100)).toBe("CODE-123");
    expect(captureReferralCode(s, null, 100 + 2_592_000_000 - 1)).toBe("CODE-123");
    expect(captureReferralCode(s, null, 100 + 2_592_000_000)).toBeNull();
    expect(s.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
  });
  it("explicit new links replace the previous code", () => {
    const s = storage();
    captureReferralCode(s, "first", 0);
    expect(captureReferralCode(s, "second", 50)).toBe("second");
    expect(captureReferralCode(s, null, 60)).toBe("second");
  });
  it("rejects unsafe, empty, and overlong codes", () => {
    expect(normalizeReferralCode("<script>" )).toBeNull();
    expect(normalizeReferralCode("x".repeat(121))).toBeNull();
    expect(normalizeReferralCode("")).toBeNull();
  });
  it("preserves country and app query parameters", () => {
    expect(withReferralCode("/en/slideshow-application?app=unswipe&country=FR", "CODE")).toBe("/en/slideshow-application?app=unswipe&country=FR&ref=CODE");
  });
  it("does not let unavailable or malformed storage break the flow", () => {
    const s = storage();
    s.setItem(REFERRAL_STORAGE_KEY, "invalid json");
    expect(captureReferralCode(s, null)).toBeNull();
    expect(captureReferralCode({ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} }, "CODE")).toBe("CODE");
  });
});