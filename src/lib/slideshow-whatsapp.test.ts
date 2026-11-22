import { describe, expect, it } from "vitest";
import { isValidWhatsapp, optionalWhatsappSchema, whatsappInsertFields } from "./slideshow-whatsapp";

describe("optional slideshow WhatsApp", () => {
  it("normalizes spaces before E.164 validation", () => {
    expect(optionalWhatsappSchema.parse(" +33 6 12 34 56 78 ")).toBe("+33612345678");
    expect(isValidWhatsapp("+36201234567")).toBe(true);
  });
  it("allows empty or omitted numbers", () => {
    expect(optionalWhatsappSchema.parse("   ")).toBe("");
    expect(optionalWhatsappSchema.parse(undefined)).toBeUndefined();
  });
  it.each(["33612345678", "+03612345678", "+123456", "+1234567890123456", "+33-612345678", "+33abc123456"])("rejects invalid E.164 %s", (number) => {
    expect(optionalWhatsappSchema.safeParse(number).success).toBe(false);
  });
  it("records opt-in only with a valid number and checked box", () => {
    const now = new Date("2026-11-22T13:40:00Z");
    expect(whatsappInsertFields("+33 612345678", true, now)).toEqual({ whatsapp_e164: "+33612345678", whatsapp_optin: true, whatsapp_optin_at: "2026-11-22T13:40:00.000Z" });
  });
  it("keeps a supplied number without opt-in or a timestamp", () => {
    expect(whatsappInsertFields("+33612345678", false)).toEqual({ whatsapp_e164: "+33612345678", whatsapp_optin: false, whatsapp_optin_at: null });
  });
  it.each([undefined, "", "   ", "invalid"])("never opts in without a valid number (%s)", (number) => {
    expect(whatsappInsertFields(number, true)).toEqual({ whatsapp_e164: null, whatsapp_optin: false, whatsapp_optin_at: null });
  });
});