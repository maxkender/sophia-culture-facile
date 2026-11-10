import { describe, expect, it } from "vitest";
import { autoAcceptReason, takenEmails, isAutoAcceptOn } from "./slideshow-auto-accept";

const base = { id: "1", status: "pending", zone: "A", country: "France", is_adult: true, email: "A@x.com", unsubscribed_at: null };
const none = new Map<string, Set<string>>();

describe("auto-accept eligibility", () => {
  it("accepts a pending adult in zone A/B/C", () => expect(autoAcceptReason(base, none)).toBeNull());
  it("refuses no zone", () => expect(autoAcceptReason({ ...base, zone: null }, none)).toBe("No zone for this country"));
  it("refuses Portugal", () => expect(autoAcceptReason({ ...base, country: "Portugal", zone: "B" }, none)).toBe("Portugal closed"));
  it("refuses minors", () => expect(autoAcceptReason({ ...base, is_adult: false }, none)).toBe("Not 18+"));
  it("refuses duplicate email case-insensitively", () => {
    const taken = takenEmails([{ id: "2", email: " a@X.com", status: "contract_signed" }]);
    expect(autoAcceptReason(base, taken)).toBe("Duplicate email");
  });
  it("ignores a rejected application with the same email", () => {
    expect(autoAcceptReason(base, takenEmails([{ id: "2", email: "a@x.com", status: "rejected" }]))).toBeNull();
  });
  it("refuses unsubscribed and non-pending", () => {
    expect(autoAcceptReason({ ...base, unsubscribed_at: "2026-01-01" }, none)).toBe("Unsubscribed");
    expect(autoAcceptReason({ ...base, status: "pool" }, none)).toBe("Not pending");
  });
  it("defaults to ON", () => { expect(isAutoAcceptOn(null)).toBe(true); expect(isAutoAcceptOn("false")).toBe(false); });
});
