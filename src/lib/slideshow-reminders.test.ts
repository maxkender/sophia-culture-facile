import { describe, expect, it } from "vitest";
import { dueReminder } from "./slideshow-reminders.server";

const acc = "2026-11-02T10:00:00Z";
const base = { status: "accepted", accepted_at: acc, signing_token: "t", timeline: {} as Record<string, unknown> };
const at = (h: number) => new Date(new Date(acc).getTime() + h * 3_600_000);

describe("signature reminders", () => {
  it("nothing before J+1", () => expect(dueReminder(base, at(23))).toBeNull());
  it("J+1 sends remind_1", () => expect(dueReminder(base, at(25))).toBe("remind_1"));
  it("J+3 sends remind_2", () => expect(dueReminder({ ...base, timeline: { remind_1: {} } }, at(73))).toBe("remind_2"));
  it("J+6 sends remind_3", () => expect(dueReminder({ ...base, timeline: { remind_1: {}, remind_2: {} } }, at(145))).toBe("remind_3"));
  it("each reminder only once", () => expect(dueReminder({ ...base, timeline: { remind_1: {} } }, at(30))).toBeNull());
  it("never after the 3rd", () => expect(dueReminder({ ...base, timeline: { remind_3: {} } }, at(160))).toBeNull());
  it("stops once signed", () => expect(dueReminder({ ...base, agreement_signed_at: acc }, at(25))).toBeNull());
  it("stops when refused", () => expect(dueReminder({ ...base, status: "rejected" }, at(25))).toBeNull());
  it("stops when unsubscribed", () => expect(dueReminder({ ...base, unsubscribed_at: acc }, at(25))).toBeNull());
  it("stops when expired", () => expect(dueReminder({ ...base, status: "expired" }, at(25))).toBeNull());
  it("ignores acceptances older than 7 days", () => expect(dueReminder(base, at(24 * 8))).toBeNull());
});
