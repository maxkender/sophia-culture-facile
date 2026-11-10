// Server-only: auto-accept runs through the same acceptSlideshowApplication as the manual Accept button.
import { acceptSlideshowApplication, loadZones } from "./slideshow-accept.server";
import { AUTO_ACCEPT_MAX_PER_SWEEP, AUTO_ACCEPT_SETTING, TAKEN_STATUSES, autoAcceptReason, emailKey, isAutoAcceptOn, takenEmails } from "./slideshow-auto-accept";

type Admin = any;
export const AUTO_BY = { id: null, name: "auto", via: "auto" } as const;

export async function autoAcceptEnabled(a: Admin): Promise<boolean> {
  const { data } = await a.from("hub_settings").select("value").eq("key", AUTO_ACCEPT_SETTING).maybeSingle();
  return isAutoAcceptOn(data?.value);
}

async function zonesWithRate(a: Admin): Promise<string[]> {
  const { data } = await a.from("pay_zones").select("zone, weekly_amount");
  return (data ?? []).filter((z: any) => z.weekly_amount != null && ["A", "B", "C"].includes(z.zone)).map((z: any) => z.zone);
}

async function audit(a: Admin, app: any, zone: string, rate: number | null) {
  const entry = { id: app.id, email: app.email, zone, rate };
  console.log("[slides-auto-accept]", JSON.stringify(entry));
  await a.from("activity_log").insert({ entity: "slideshow_application", entity_id: app.id, action: "auto_accept", comment: JSON.stringify(entry) }).then(() => null, () => null);
}

export type AutoResult = { ok: true; enabled: boolean; accepted: { id: string; email: string; zone: string; rate: number | null }[]; skipped: number; failed: { id: string; error: string }[]; remaining: number };

/** Accept eligible pending applications (all, or only `ids`), oldest first, at most 100. */
export async function runAutoAccept(a: Admin, ids?: string[]): Promise<AutoResult> {
  const out: AutoResult = { ok: true, enabled: await autoAcceptEnabled(a), accepted: [], skipped: 0, failed: [], remaining: 0 };
  if (!out.enabled) return out;
  let q = a.from("slideshow_applications").select("id, status, zone, country, is_adult, email, unsubscribed_at").eq("status", "pending").order("created_at", { ascending: true }).limit(2000);
  if (ids) q = q.in("id", ids);
  const { data: pending } = await q;
  const { data: takenRows } = await a.from("slideshow_applications").select("id, email, status").in("status", TAKEN_STATUSES).limit(10000);
  const taken = takenEmails(takenRows ?? []);
  const rated = await zonesWithRate(a);
  const { data: rates } = await a.from("pay_zones").select("zone, weekly_amount");
  const rateOf = (z: string) => { const r = (rates ?? []).find((x: any) => x.zone === z); return r?.weekly_amount != null ? Number(r.weekly_amount) : null; };
  const eligible = (pending ?? []).filter((app: any) => autoAcceptReason(app, taken, rated) === null);
  out.skipped = (pending ?? []).length - eligible.length;
  const batch = eligible.slice(0, AUTO_ACCEPT_MAX_PER_SWEEP);
  out.remaining = eligible.length - batch.length;
  const zones = batch.length ? await loadZones(a) : null;
  for (const app of batch) {
    // Two pending applications with the same email: only the first one is accepted.
    if (autoAcceptReason(app, taken, rated)) { out.skipped++; continue; }
    try {
      await acceptSlideshowApplication(a, { applicationId: app.id }, AUTO_BY, zones);
      const s = taken.get(emailKey(app.email)) ?? new Set<string>(); s.add(app.id); taken.set(emailKey(app.email), s);
      const entry = { id: app.id, email: app.email, zone: app.zone, rate: rateOf(app.zone) };
      out.accepted.push(entry);
      await audit(a, app, app.zone, entry.rate);
    } catch (e) {
      out.failed.push({ id: app.id, error: (e as Error).message });
    }
  }
  return out;
}
