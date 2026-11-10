import { SITE_URL } from "@/config/site";
// Server-only: signature reminders for accepted slideshow posters who have not signed yet.
// Automatic at J+1, J+3, J+6 after acceptance (timeline keys remind_1/2/3, once each); manual sends use remind_manual.

export const REMIND_SLOTS = [
  { key: "remind_1", days: 1 },
  { key: "remind_2", days: 3 },
  { key: "remind_3", days: 6 },
] as const;
export type RemindKey = (typeof REMIND_SLOTS)[number]["key"] | "remind_manual";
/** Automatic reminders only cover acceptances from the last 7 days, so older backlogs are never mass-emailed. */
export const AUTO_WINDOW_DAYS = 7;
const DAY = 86_400_000;
const SITE = () => process.env["SITE_URL"] ?? SITE_URL;

type AppLike = {
  status: string;
  start_monday?: string | null;
  accepted_at: string | null;
  agreement_signed_at?: string | null;
  contract_signed_at?: string | null;
  unsubscribed_at?: string | null;
  expired_at?: string | null;
  signing_token?: string | null;
  timeline?: unknown;
};

/** Why a reminder cannot go out (null = it can). */
export function blockedReason(app: AppLike): string | null {
  if (app.agreement_signed_at || app.contract_signed_at) return "already_signed";
  if (app.unsubscribed_at) return "unsubscribed";
  if (app.expired_at || app.status === "expired") return "expired";
  if (!["accepted", "approved"].includes(app.status)) return "not_accepted";
  if (!app.signing_token) return "no_signing_link";
  return null;
}

/** The automatic reminder due now, or null. Only the latest due slot counts, and only if it was never sent. */
export function dueReminder(app: AppLike, now = new Date()): RemindKey | null {
  if (blockedReason(app) || !app.accepted_at) return null;
  const age = now.getTime() - new Date(app.accepted_at).getTime();
  if (age < 0 || age >= AUTO_WINDOW_DAYS * DAY) return null;
  const tl = (app.timeline ?? {}) as Record<string, unknown>;
  const due = [...REMIND_SLOTS].reverse().find((s) => age >= s.days * DAY);
  if (!due || tl[due.key]) return null;
  return due.key;
}

async function stamp(a: any, appId: string, key: string, by: string) {
  const { data } = await a.from("slideshow_applications").select("timeline").eq("id", appId).maybeSingle();
  await a.from("slideshow_applications").update({ timeline: { ...((data?.timeline as object) ?? {}), [key]: { at: new Date().toISOString(), by } } }).eq("id", appId);
}

export async function sendSignatureReminder(a: any, app: AppLike & { id: string; email: string; full_name: string }, key: RemindKey, by: string) {
  const blocked = blockedReason(app);
  if (blocked) return { sent: false as const, reason: blocked };
  const { posterEmails } = await import("./slideshow-emails.server");
  const r = await posterEmails.remindSignature(app.email, app.full_name, `${SITE()}/creators/sign/${app.signing_token}`, app.start_monday);
  if (!r.sent) return { sent: false as const, reason: r.reason ?? "email_failed" };
  await stamp(a, app.id, key, by);
  return { sent: true as const };
}

const COLS = "start_monday, id, email, full_name, status, accepted_at, agreement_signed_at, contract_signed_at, unsubscribed_at, expired_at, signing_token, timeline";

/** Cron entry: send each due J+1 / J+3 / J+6 reminder once. */
export async function runSignatureReminders(a: any, now = new Date()) {
  const since = new Date(now.getTime() - AUTO_WINDOW_DAYS * DAY).toISOString();
  const { data, error } = await a.from("slideshow_applications").select(COLS)
    .in("status", ["accepted", "approved"]).is("agreement_signed_at", null).is("contract_signed_at", null)
    .is("unsubscribed_at", null).gte("accepted_at", since).limit(500);
  if (error) throw new Error(error.message);
  let sent = 0, failed = 0;
  for (const app of data ?? []) {
    const key = dueReminder(app, now);
    if (!key) continue;
    const r = await sendSignatureReminder(a, app, key, "Automatic reminder").catch((e: Error) => ({ sent: false as const, reason: e.message }));
    if (r.sent) sent++; else failed++;
  }
  return { ok: true, checked: data?.length ?? 0, sent, failed };
}

/** Admin "Send signature reminder" (single or bulk). */
export async function sendManualReminders(a: any, ids: string[], by: string) {
  const { data, error } = await a.from("slideshow_applications").select(COLS).in("id", ids);
  if (error) throw new Error(error.message);
  let sent = 0;
  const skipped: { id: string; reason: string }[] = [];
  for (const app of data ?? []) {
    const r = await sendSignatureReminder(a, app, "remind_manual", by).catch((e: Error) => ({ sent: false as const, reason: e.message }));
    if (r.sent) sent++; else skipped.push({ id: app.id, reason: r.reason });
  }
  return { sent, skipped };
}
