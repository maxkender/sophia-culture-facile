// Server-only: slideshow poster lifecycle (accept → contract → OS account → started), OS snapshots and weekly payouts.
import { callOs } from "./os-bridge.server";
import { pickLang, posterEmails } from "./slideshow-emails.server";
import { sendBrevoEmail } from "./brevo.server";
import { countryCodeOf } from "@/config/countries";

type Admin = any;
const SITE = () => process.env["SITE_URL"] ?? "https://sophia-culture.com";
const day = (d: Date) => d.toISOString().slice(0, 10);

/** The next Monday at least 3 days away (UTC dates). */
export function nextStartMonday(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 3);
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  return day(d);
}
/** Signing can defer the accepted Monday, but must never bring it forward. */
export function startMondayAtSignature(stored: string | null, now = new Date()): string {
  const next = nextStartMonday(now);
  return stored && stored > next ? stored : next;
}
/** Monday of the week containing `d` (UTC). */
export function mondayOf(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return day(x);
}
export const addDays = (iso: string, n: number) => { const x = new Date(`${iso}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return day(x); };

async function setting(admin: Admin, key: string): Promise<string | null> {
  const { data } = await admin.from("hub_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || null;
}

export function randomToken(bytes = 24) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
}

import { RUUL_BLOCKED } from "./ruul";
export { RUUL_BLOCKED };

/** OS refusal codes → plain words for the poster card. */
export function osErrorInWords(error: string, langue?: string | null): string {
  if (error.includes("zone_non_ouverte")) return "Closed in OS";
  if (error.includes("langue_non_geree")) return `The HM for this country does not handle ${langue ?? "this language"} yet`;
  if (error.includes("creation_en_cours")) return "Creation in progress, retry in 5 minutes";
  return error;
}

/** OS `zones` action, cached 10 minutes in hub_settings. */
export async function getOsZones(admin: Admin): Promise<{ ok: boolean; ouverts: { pays_code: string; langue?: string | null; langue_os: boolean }[]; fermes: { pays_code: string; raison?: string }[]; error?: string }> {
  const { data: cached } = await admin.from("hub_settings").select("value, updated_at").eq("key", "os_zones_cache").maybeSingle();
  if (cached?.value && cached.updated_at && Date.now() - new Date(cached.updated_at).getTime() < 10 * 60_000) {
    try { const p = JSON.parse(cached.value); return { ok: true, ouverts: (p.ouverts ?? []).map((o: any) => ({ ...o, langue_os: o.langue_os === true })), fermes: p.fermes ?? [] }; } catch { /* refetch */ }
  }
  const r = await callOs<{ ouverts: { pays_code: string; hm_id?: string | null; langue?: string | null; langue_os?: boolean }[]; fermes: { pays_code: string; raison?: string }[] }>(admin, "zones", {});
  if (!r.ok) return { ok: false, ouverts: [], fermes: [], error: r.error };
  // Every country listed in "ouverts" is open, whatever hm_id is (null = HM without an OS account).
  const ouverts = (r.ouverts ?? []).filter((o) => o?.pays_code).map((o) => ({ pays_code: String(o.pays_code).toUpperCase(), langue: o.langue ?? null, langue_os: o.langue_os === true }));
  const fermes = (r.fermes ?? []).filter((f) => f?.pays_code).map((f) => ({ ...f, pays_code: String(f.pays_code).toUpperCase() }));
  await admin.from("hub_settings").upsert({ key: "os_zones_cache", value: JSON.stringify({ ouverts, fermes }), updated_at: new Date().toISOString() });
  return { ok: true, ouverts, fermes };
}

async function tick(admin: Admin, appId: string, key: string, by: string) {
  const { data } = await admin.from("slideshow_applications").select("timeline").eq("id", appId).maybeSingle();
  await admin.from("slideshow_applications").update({ timeline: { ...(data?.timeline ?? {}), [key]: { at: new Date().toISOString(), by } } }).eq("id", appId);
}

/** Called once the contract is signed (and from Retry). Never emails the poster unless the OS call succeeded. */
export async function createPosterInOs(admin: Admin, applicationId: string) {
  const { data: a } = await admin.from("slideshow_applications").select("*").eq("id", applicationId).maybeSingle();
  if (!a) return { ok: false, error: "Application not found" };
  if (!["contract_signed", "os_created"].includes(a.status)) return { ok: false, error: "The contract is not signed yet." };
  const [prenom, ...rest] = String(a.full_name).trim().split(/\s+/);
  const code = countryCodeOf(a.country);
  const r = await callOs<{ profile_id: string; email_os: string; password: string | null; langue?: string | null; manager: { id: string; prenom: string; nom: string; email: string } | null; existed: boolean; deja_connecte?: boolean }>(admin, "creer_posteur", {
    hub_id: a.id, prenom, nom: rest.join(" "), email_perso: a.email, telephone: a.phone, pays_code: code, pays_nom: a.country,
    langue: a.langue ?? "en", zone_paiement: a.zone, applications: a.applications ?? [], deux_telephones: Boolean(a.deux_telephones), source: "site", start_monday: a.start_monday,
    ref: a.ref ?? null,
  });
  if (!r.ok) {
    const friendly = osErrorInWords(r.error, a.langue);
    await admin.from("slideshow_applications").update({ os_error: friendly }).eq("id", a.id);
    return { ok: false, error: friendly };
  }
  const managerName = r.manager ? `${r.manager.prenom} ${r.manager.nom}`.trim() : null;
  await admin.from("slideshow_applications").update({
    status: "os_created", os_created_at: new Date().toISOString(), os_profile_id: r.profile_id, os_email: r.email_os, os_error: null,
    os_langue: r.langue ?? null, manager_name: managerName, manager_email: r.manager?.email ?? null,
  }).eq("id", a.id);
  await tick(admin, a.id, "os_created", "Sophia OS");
  // The OS returns password: null when the poster already existed and already logged in — no logins email then.
  if (typeof r.password === "string" && r.password) {
    const l = pickLang(a.langue);
    const { data: pz } = await admin.from("pay_zones").select("weekly_amount, first_week_amount").eq("zone", a.zone).maybeSingle();
    await posterEmails.logins(a.email, a.full_name, l, {
      osUrl: (await setting(admin, "os_app_url")) ?? "https://sophia-marketing-orga.vercel.app",
      login: r.email_os, password: r.password, slack: await setting(admin, "slideshow_slack_invite_url"), monday: a.start_monday, ruulEmail: a.ruul_email || a.email,
      weekly: pz?.weekly_amount != null ? Number(pz.weekly_amount) : null, first: pz?.first_week_amount != null ? Number(pz.first_week_amount) : null,
    });
    await tick(admin, a.id, "logins_sent", "Sophia OS");
  }
  if (!r.existed || !a.os_created_at) {
    await notifyManager(admin, { name: a.full_name, country: a.country, monday: a.start_monday, managerEmail: null });
    await admin.from("slideshow_applications").update({ hm_notified_at: new Date().toISOString() }).eq("id", a.id);
    await tick(admin, a.id, "hm_notified", "Sophia OS");
  }
  return { ok: true };
}

/** Site posters have no hiring manager (OS "RUUL cohort" profile has no mailbox): Slack webhook, else email the owner. */
async function notifyManager(admin: Admin, o: { name: string; country: string; monday: string; managerEmail?: string | null }) {
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${o.monday}T12:00:00Z`));
  const text = `New Ruul poster: ${o.name}, ${o.country}, starts Monday ${date}. Add them in Ruul and to #ruul-cohort.`;
  const hook = process.env["SLACK_WEBHOOK_URL"];
  if (hook) {
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => null);
    if (res?.ok) return;
  }
  await sendBrevoEmail({ to: "maximilien@vikstudios.com", subject: `New Ruul poster: ${o.name}`, html: `<p>${text}</p>`, text });
  void admin;
}

/** Daily 06:30 Paris: cache this week's and last week's OS counts; mark posters started on their Monday. */
export async function refreshSnapshots(admin: Admin) {
  const { data: rows } = await admin.from("slideshow_applications").select("id, os_profile_id, status, start_monday").in("status", ["os_created", "started"]).not("os_profile_id", "is", null);
  const list = (rows ?? []) as { id: string; os_profile_id: string; status: string; start_monday: string | null }[];
  if (!list.length) return { ok: true, posters: 0 };
  const byProfile = new Map(list.map((r) => [r.os_profile_id, r]));
  const today = day(new Date());
  let saved = 0;
  for (const lundi of [mondayOf(), addDays(mondayOf(), -7)]) {
    const r = await callOs<{ rows: { profile_id: string; prevus: number; publies: number; manques: number; dernier_post_at: string | null; is_active: boolean }[] }>(admin, "posts_semaine", { profile_ids: [...byProfile.keys()], lundi });
    if (!r.ok) return { ok: false, error: r.error, notConnected: (r as { notConnected?: boolean }).notConnected ?? false };
    for (const x of r.rows ?? []) {
      const app = byProfile.get(x.profile_id);
      if (!app) continue;
      await admin.from("os_snapshots").upsert({ application_id: app.id, os_profile_id: x.profile_id, lundi, prevus: x.prevus, publies: x.publies, manques: x.manques, dernier_post_at: x.dernier_post_at, is_active: x.is_active, fetched_at: new Date().toISOString() }, { onConflict: "os_profile_id,lundi" });
      saved++;
      if (lundi === mondayOf() && app.status === "os_created" && app.start_monday && app.start_monday <= today && x.is_active) {
        await admin.from("slideshow_applications").update({ status: "started", started_at: new Date().toISOString() }).eq("id", app.id);
      }
    }
  }
  const stats = await callOs(admin, "stats_pays", {});
  if (stats.ok) await admin.from("hub_settings").upsert({ key: "os_stats", value: JSON.stringify(stats), updated_at: new Date().toISOString() });
  return { ok: true, posters: list.length, saved };
}

export const MIN_PAYOUT = 20;

/** Explicit admin action: prepare editable weekly rows, using cached counts when available; never call the OS. Every started poster is paid through Ruul. */
export async function buildWeek(admin: Admin, lundi = addDays(mondayOf(), -7)) {
  const [{ data: posters }, { data: zones }] = await Promise.all([
    admin.from("slideshow_applications").select("id, zone, start_monday, os_profile_id, payout_channel").eq("status", "started"),
    admin.from("pay_zones").select("zone, weekly_amount"),
  ]);
  const rate: Record<string, number> = Object.fromEntries((zones ?? []).map((z: any) => [z.zone, Number(z.weekly_amount ?? 0)]));
  let built = 0, skipped = 0;
  for (const p of posters ?? []) {
    const { data: existing } = await admin.from("slideshow_payouts").select("id, status").eq("application_id", p.id).eq("week_start", lundi).maybeSingle();
    if (p.start_monday && p.start_monday > lundi) continue;
    if (existing) continue;
    const { data: snap } = p.os_profile_id ? await admin.from("os_snapshots").select("*").eq("os_profile_id", p.os_profile_id).eq("lundi", lundi).maybeSingle() : { data: null };
    const { data: carried } = await admin.from("slideshow_payouts").select("id, amount, carried_in").eq("application_id", p.id).eq("status", "carried").lt("week_start", lundi);
    const carriedIn = (carried ?? []).reduce((s: number, c: any) => s + Number(c.amount ?? 0) + Number(c.carried_in ?? 0), 0);
    const first = p.start_monday === lundi;
    const base = rate[p.zone] ?? 0;
    const row: Record<string, unknown> = { application_id: p.id, week_start: lundi, zone: p.zone, rate: base, first_week: first };
    const missed = Number(snap?.manques ?? 0);
    // Owner decision 17/10: pay does NOT depend on missed posts. Counts stay on the row for information only.
    const suggested = Math.max(0, base + (first ? 1 : 0));
    Object.assign(row, { status: "draft", skip_reason: null, prevus: snap?.prevus ?? null, publies: snap?.publies ?? null, manques: snap ? missed : null, suggested, amount: suggested, carried_in: carriedIn, ...(!snap ? { note: "Manual week — confirm attendance and adjust amount before approval" } : {}) });
    built++;
    await admin.from("slideshow_payouts").upsert(row, { onConflict: "application_id,week_start" });
    if (carried?.length) await admin.from("slideshow_payouts").update({ status: "rolled" }).in("id", carried.map((c: any) => c.id));
  }
  return { ok: true, lundi, built, skipped };
}

/** Day 60 in the pool: polite email, status expired. Daily 10:00 Paris. */
export async function expirePool(admin: Admin) {
  const cutoff = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data } = await admin.from("slideshow_applications").select("id, email, full_name, langue").eq("status", "pool").lte("pool_at", cutoff).limit(200);
  let n = 0;
  for (const a of data ?? []) {
    await posterEmails.expired(a.email, a.full_name, pickLang(a.langue));
    await admin.from("slideshow_applications").update({ status: "expired", expired_at: new Date().toISOString() }).eq("id", a.id);
    n++;
  }
  return { ok: true, expired: n };
}

export async function stripeClient() {
  let key = process.env["STRIPE_SECRET_KEY"];
  if (key?.startsWith("sk_live_") && process.env["STRIPE_ALLOW_LIVE"] !== "true") {
    key = process.env["STRIPE_TEST_API_KEY"];
    if (!key) throw new Error("Stripe is in live mode. Add a test key (sk_test_…) to try payouts safely.");
  }
  if (!key) throw new Error("Stripe is not configured");
  const Stripe = (await import("stripe")).default;
  return new Stripe(key);
}

export const payoutLink = (token: string) => `${SITE()}/payout/${token}`;
