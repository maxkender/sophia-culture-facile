// Server-only: the ONE acceptance path for slideshow poster applications (single Accept, Accept all, assistant job).
import { getOsZones, nextStartMonday, randomToken, RUUL_BLOCKED } from "./slideshows.server";
import { posterEmails } from "./slideshow-emails.server";
import { countryCodeOf, langOfCountry } from "@/config/countries";

type Admin = any;
export type Langue = "fr" | "en" | "es" | "it" | "pt" | "de";
export type AcceptInput = { applicationId: string; apps?: ("sophia" | "unswipe")[]; zone?: "A" | "B" | "C"; langue?: Langue };
export type AcceptBy = { id: string | null; name: string };
type Zones = Awaited<ReturnType<typeof getOsZones>> | null;

/** Statuses that no longer count as an active application for duplicate checks. */
const INACTIVE = ["rejected", "expired", "dropped"];
const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");

export async function loadZones(a: Admin): Promise<Zones> {
  return process.env["OS_HUB_SECRET"] ? getOsZones(a) : null;
}

/** Same refusals as the single Accept button. Returns a reason, or null when acceptable. */
export function refusalReason(app: any, zones: Zones): string | null {
  if (!["pending", "pool"].includes(app.status)) return "This application was already decided.";
  const code = countryCodeOf(app.country);
  if (zones?.ok && code && !zones.ouverts.some((o) => o.pays_code === code)) {
    const closed = zones.fermes.find((f) => f.pays_code === code);
    return closed?.raison ? `Closed in OS — ${closed.raison}` : "Closed in OS";
  }
  if (code && RUUL_BLOCKED.includes(code)) return "Country not supported by Ruul";
  return null;
}

/** Another active application with the same email or phone. */
export async function duplicateReason(a: Admin, app: any): Promise<string | null> {
  const { data } = await a.from("slideshow_applications").select("id, email, phone, status").neq("id", app.id).not("status", "in", `(${INACTIVE.join(",")})`);
  const email = String(app.email ?? "").trim().toLowerCase();
  const phone = digits(app.phone);
  const hit = (data ?? []).find((r: any) => (email && String(r.email ?? "").trim().toLowerCase() === email) || (phone.length >= 6 && digits(r.phone) === phone));
  return hit ? "Possible duplicate (same email or phone as another active application)" : null;
}

/** Defaults used when accepting without the card (bulk / assistant): same defaults the card pre-fills. */
export function defaultsFor(app: any) {
  return { apps: ["sophia"] as ("sophia" | "unswipe")[], zone: app.zone as "A" | "B" | "C" | null, langue: ((app.langue as Langue | null) ?? langOfCountry(app.country)) as Langue };
}

/** Accept one application: status, start Monday, signing token, timeline, acceptance email. Throws on refusal. */
export async function acceptSlideshowApplication(a: Admin, input: AcceptInput, by: AcceptBy, zones?: Zones) {
  const { data: app } = await a.from("slideshow_applications").select("*").eq("id", input.applicationId).maybeSingle();
  if (!app) throw new Error("Application not found");
  const z = zones === undefined ? await loadZones(a) : zones;
  const refused = refusalReason(app, z);
  if (refused) throw new Error(refused);
  const d = defaultsFor(app);
  const apps = input.apps?.length ? input.apps : d.apps;
  const zone = input.zone ?? d.zone;
  const langue = input.langue ?? d.langue;
  if (!zone) throw new Error("No pay zone for this country");
  const monday = nextStartMonday();
  const token = randomToken();
  const now = new Date().toISOString();
  await a.from("slideshow_applications").update({
    status: "accepted", accepted_at: now, decided_at: now, decided_by: by.id,
    applications: apps, langue, start_monday: monday, signing_token: token, signing_token_created_at: now, payout_channel: "ruul",
    ...(zone !== app.zone ? { zone, zone_override: true, zone_note: `Set at acceptance by ${by.name}` } : {}),
  }).eq("id", app.id);
  const { data: tlRow } = await a.from("slideshow_applications").select("timeline").eq("id", app.id).maybeSingle();
  await a.from("slideshow_applications").update({ timeline: { ...(tlRow?.timeline ?? {}), accepted: { at: new Date().toISOString(), by: by.name } } }).eq("id", app.id);
  const site = process.env["SITE_URL"] ?? "https://sophia-culture.com";
  const { data: zr } = await a.from("pay_zones").select("weekly_amount, first_week_amount").eq("zone", zone).maybeSingle();
  const guideUrl = (await a.from("hub_settings").select("value").eq("key", "slideshow_poster_guide_url").maybeSingle()).data?.value ?? null;
  const slackUrl = (await a.from("hub_settings").select("value").eq("key", "slideshow_slack_invite_url").maybeSingle()).data?.value ?? null;
  const sent = await posterEmails.accepted(app.email, app.full_name, langue, monday, `${site}/creators/sign/${token}`, zr?.weekly_amount != null ? Number(zr.weekly_amount) : null, zr?.first_week_amount != null ? Number(zr.first_week_amount) : null, guideUrl, slackUrl);
  return { ok: true as const, startMonday: monday, emailed: sent.sent, reason: sent.reason ?? null, name: app.full_name as string, country: app.country as string };
}

export type BulkResult = {
  ok: true; dry_run: boolean;
  accepted: { id: string; name: string; country: string; start_monday: string }[];
  skipped: { id: string; name: string; reason: string }[];
  failed: { id: string; error: string }[];
};

/** Accept many, one by one, through acceptSlideshowApplication. Skips refusals and possible duplicates. */
export async function acceptMany(a: Admin, ids: string[], by: AcceptBy, dryRun = false): Promise<BulkResult> {
  const out: BulkResult = { ok: true, dry_run: dryRun, accepted: [], skipped: [], failed: [] };
  const zones = await loadZones(a);
  for (const id of ids) {
    try {
      const { data: app } = await a.from("slideshow_applications").select("*").eq("id", id).maybeSingle();
      if (!app) { out.failed.push({ id, error: "Application not found" }); continue; }
      const reason = refusalReason(app, zones) ?? (await duplicateReason(a, app)) ?? (defaultsFor(app).zone ? null : "No pay zone for this country");
      if (reason) { out.skipped.push({ id, name: app.full_name, reason }); continue; }
      if (dryRun) { out.accepted.push({ id, name: app.full_name, country: app.country, start_monday: nextStartMonday() }); continue; }
      const r = await acceptSlideshowApplication(a, { applicationId: id }, by, zones);
      out.accepted.push({ id, name: r.name, country: r.country, start_monday: r.startMonday });
    } catch (e) {
      out.failed.push({ id, error: (e as Error).message });
    }
  }
  return out;
}

/** VALID for "Accept all valid": acceptable, OS publishes in the country's language, not a duplicate, has a pay zone. Null = valid. */
export function validReason(app: any, zones: Zones, duplicate: string | null = null): string | null {
  const refused = refusalReason(app, zones);
  if (refused) return refused;
  const code = countryCodeOf(app.country);
  const entry = zones?.ok && code ? zones.ouverts.find((o) => o.pays_code === code) : undefined;
  if (!entry) return "Closed in OS";
  if (entry.langue_os !== true) return "Language not in the OS";
  if (duplicate) return duplicate;
  if (!defaultsFor(app).zone) return "No pay zone for this country";
  return null;
}

export type ValidSelection = { valid: { id: string; name: string; country: string }[]; skipped: { id: string; name: string; country: string; reason: string }[] };

/** All pending/pool applications split into valid (oldest first) and skipped with reason. Duplicates checked in one query. */
export async function selectAllValid(a: Admin, zones?: Zones): Promise<ValidSelection> {
  const z = zones === undefined ? await loadZones(a) : zones;
  const { data: pending } = await a.from("slideshow_applications").select("*").in("status", ["pending", "pool"]).order("created_at", { ascending: true }).limit(2000);
  const { data: active } = await a.from("slideshow_applications").select("id, email, phone").not("status", "in", `(${INACTIVE.join(",")})`).limit(5000);
  const out: ValidSelection = { valid: [], skipped: [] };
  for (const app of pending ?? []) {
    const email = String(app.email ?? "").trim().toLowerCase();
    const phone = digits(app.phone);
    const dup = (active ?? []).some((r: any) => r.id !== app.id && ((email && String(r.email ?? "").trim().toLowerCase() === email) || (phone.length >= 6 && digits(r.phone) === phone)))
      ? "Possible duplicate (same email or phone as another active application)" : null;
    const reason = validReason(app, z, dup);
    const row = { id: app.id as string, name: app.full_name as string, country: app.country as string };
    if (reason) out.skipped.push({ ...row, reason }); else out.valid.push(row);
  }
  return out;
}

/** Accept up to `limit` valid applications through acceptMany; returns the bulk result plus valid ones left. */
export async function acceptAllValidRun(a: Admin, by: AcceptBy, dryRun: boolean, limit = 50) {
  const zones = await loadZones(a);
  const sel = await selectAllValid(a, zones);
  if (dryRun) return { ok: true as const, dry_run: true, ...sel, remaining: sel.valid.length };
  const batch = sel.valid.slice(0, limit);
  const r = await acceptMany(a, batch.map((v) => v.id), by);
  return { ...r, skipped: [...sel.skipped.map(({ id, name, reason }) => ({ id, name, reason })), ...r.skipped], remaining: Math.max(0, sel.valid.length - batch.length) };
}
