import { describe, it, expect, vi } from "vitest";
vi.mock("./slideshows.server", () => ({ getOsZones: vi.fn(), nextStartMonday: vi.fn(), randomToken: vi.fn(), RUUL_BLOCKED: ["IR"] }));
vi.mock("./slideshow-emails.server", () => ({ posterEmails: {} }));
import { validReason } from "./slideshow-accept.server";
import { scopeValidSelection } from "./slideshow-valid-selection";
const zones = (langue_os: boolean) => ({ ok: true, ouverts: [{ pays_code: "FR", langue: "fr", langue_os }, { pays_code: "IR", langue: "fa", langue_os: true }], fermes: [{ pays_code: "DE" }] });
const app = (country: string) => ({ id: "x", status: "pending", country, zone: "A" });
describe("validReason", () => {
  it("open + langue_os true → valid", () => expect(validReason(app("France"), zones(true))).toBeNull());
  it("langue_os false → Language not in the OS", () => expect(validReason(app("France"), zones(false))).toBe("Language not in the OS"));
  it("missing langue_os counts as false", () => expect(validReason(app("France"), { ok: true, ouverts: [{ pays_code: "FR" } as any], fermes: [] })).toBe("Language not in the OS"));
  it("closed → Closed in OS", () => expect(validReason(app("Germany"), zones(true))).toBe("Closed in OS"));
  it("Ruul-blocked", () => expect(validReason(app("Iran"), zones(true))).toBe("Country not supported by Ruul"));
  it("duplicate", () => expect(validReason(app("France"), zones(true), "Possible duplicate")).toBe("Possible duplicate"));
});

describe("country-batch confirmed selection", () => {
  const selection = {
    valid: [
      { id: "fr-1", country: "France" },
      { id: "pl-1", country: "Poland" },
      { id: "fr-new", country: "France" },
    ],
    skipped: [{ id: "pl-skipped", country: "Poland", reason: "Language not in the OS" }],
  };
  it("accepts only the confirmed IDs, excluding other countries and later arrivals", () => {
    expect(scopeValidSelection(selection, ["fr-1"]).valid).toEqual([{ id: "fr-1", country: "France" }]);
  });
  it("never promotes a selected application that now fails validation", () => {
    const result = scopeValidSelection(selection, ["pl-1", "pl-skipped"]);
    expect(result.valid.map((row) => row.id)).toEqual(["pl-1"]);
    expect(result.skipped).toEqual(selection.skipped);
  });
  it("selecting no country cannot fall back to accepting everyone", () => {
    expect(scopeValidSelection(selection, [])).toEqual({ valid: [], skipped: [] });
  });
  it("keeps the existing unscoped selection when no filter is supplied", () => {
    expect(scopeValidSelection(selection)).toEqual(selection);
  });
});
