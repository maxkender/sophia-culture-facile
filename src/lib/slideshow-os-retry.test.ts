import { describe, it, expect } from "vitest";
import { shouldRetryOs, type OsRetryRow } from "./slideshow-os-retry";

const now = new Date("2026-11-18T12:00:00Z");
const base: OsRetryRow = { id: "x", status: "contract_signed", agreement_signed_at: "2026-11-18T11:00:00Z", os_created_at: null, os_error: null, start_monday: "2026-11-23" };

describe("slides-os-retry selection", () => {
  it("picks silent failures signed >15 min ago with a future start", () => expect(shouldRetryOs(base, now)).toBe(true));
  it("waits 15 minutes after signing", () => expect(shouldRetryOs({ ...base, agreement_signed_at: "2026-11-18T11:50:00Z" }, now)).toBe(false));
  it("never auto-creates for a past start Monday", () => expect(shouldRetryOs({ ...base, start_monday: "2026-11-16" }, now)).toBe(false));
  it("accepts a start Monday equal to today", () => expect(shouldRetryOs({ ...base, start_monday: "2026-11-18" }, now)).toBe(true));
  it("still retries rows with os_error", () => expect(shouldRetryOs({ ...base, os_error: "boom", start_monday: "2026-11-16" }, now)).toBe(true));
  it("skips rows already created in the OS", () => expect(shouldRetryOs({ ...base, os_created_at: "2026-11-18T11:01:00Z" }, now)).toBe(false));
});
