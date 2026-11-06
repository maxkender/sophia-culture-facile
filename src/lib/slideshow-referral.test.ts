import { describe, it, expect } from "vitest";
import { referralFields } from "./slideshow-referral";
describe("slideshow referral validation", () => {
  it("yes + name → saved trimmed", () => expect(referralFields({ referred: true, referral_name: "  Ana  " })).toEqual({ referred: true, referral_name: "Ana" }));
  it("yes + empty → error", () => expect(() => referralFields({ referred: true, referral_name: "  " })).toThrow());
  it("no → name null", () => expect(referralFields({ referred: false, referral_name: "Ana" })).toEqual({ referred: false, referral_name: null }));
  it("missing fields → null", () => expect(referralFields({})).toEqual({ referred: null, referral_name: null }));
});
