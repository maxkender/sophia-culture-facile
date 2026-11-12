import { describe, expect, it, vi } from "vitest";
import { dueReminder, runSignatureReminders, sendSignatureReminder } from "./slideshow-reminders.server";

const send = vi.hoisted(() => vi.fn(async () => ({ sent: true as boolean, reason: undefined as string|undefined })));
vi.mock("./slideshow-emails.server", () => ({ posterEmails: { remindSignature: send } }));

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
  it("an October acceptance with no reminders is never backfilled on 12 November", () => expect(dueReminder({ ...base, accepted_at: "2026-10-22T16:17:10Z" }, new Date("2026-11-12T10:52:00Z"))).toBeNull());
  it("a new acceptance is due after 48 hours even without a previous reminder", () => expect(dueReminder(base, at(48))).toBe("remind_1"));
});

function adminFor(rows: unknown[], writeError: unknown = null) {
  const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: writeError })) }));
  const q: any = { then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve), maybeSingle: vi.fn(async () => ({ data: { timeline: {} }, error: null })) };
  for (const method of ["select", "in", "is", "gte", "lte", "order", "eq"]) q[method] = vi.fn(() => q);
  return { from: vi.fn(() => ({ ...q, update })), q, update };
}

describe("reminder delivery without real sends", () => {
  it("checks every due applicant even when there are more than 500", async () => {
    send.mockClear();
    const rows = Array.from({ length: 501 }, (_, i) => ({ ...base, id: `app-${i}`, email: "test@example.invalid", full_name: "Test Poster" }));
    const a = adminFor(rows);
    expect(await runSignatureReminders(a, at(48))).toEqual({ ok: true, checked: 501, sent: 501, failed: 0 });
    expect(send).toHaveBeenCalledTimes(501);
    expect(a.q.lte).toHaveBeenCalledWith("accepted_at", at(24).toISOString());
  });
  it("does not send any historical backlog rows returned by the query", async () => {
    send.mockClear();
    const a = adminFor([{ ...base, id: "old", email: "test@example.invalid", full_name: "Old Poster", accepted_at: "2026-10-22T16:17:10Z" }]);
    expect(await runSignatureReminders(a, new Date("2026-11-12T10:52:00Z"))).toEqual({ ok: true, checked: 1, sent: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });
  it("does not mark a refused email as sent and records a diagnostic", async () => {
    send.mockResolvedValueOnce({ sent: false, reason: "brevo_key_missing" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const a = adminFor([{ ...base, id: "failed", email: "test@example.invalid", full_name: "Test Poster" }]);
    expect(await runSignatureReminders(a, at(48))).toEqual({ ok: true, checked: 1, sent: 0, failed: 1 });
    expect(a.update).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("[slides-remind] reminder failed", { id: "failed", key: "remind_1", reason: "brevo_key_missing" });
    log.mockRestore();
  });
  it("does not claim success when the reminder log cannot be saved", async () => {
    const a = adminFor([], { message: "write failed" });
    await expect(sendSignatureReminder(a, { ...base, id: "failed", email: "test@example.invalid", full_name: "Test Poster" }, "remind_1", "Test")).rejects.toThrow("reminder_timeline_write_failed");
  });
});
