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

/** Called once the contract is signed (and from Retry). Never emails the poster unless the OS call succeeded. */
export async function createPosterInOs(admin: Admin, applicationId: string) {
  const { data: a } = await admin.from("slideshow_applications").select("*").eq("id", applicationId).maybeSingle();
  if (!a) return { ok: false, error: "Application not found" };
  if (!["contract_signed", "os_created"].includes(a.status)) return { ok: false, error: "The contract is not signed yet." };
  const [prenom, ...rest] = String(a.full_name).trim().split(/\s+/);
  const code = countryCodeOf(a.country);
  const r = await callOs<{ profile_id: string; email_os: string; password: string; manager: { id: string; prenom: string; nom: string; email: string } | null; existed: boolean }>(admin, "creer_posteur", {
    hub_id: a.id, prenom, nom: rest.join(" "), email_perso: a.email, telephone: a.phone, pays_code: code, pays_nom: a.country,
    langue: a.langue ?? "en", zone_paiement: a.zone, applications: a.applications ?? [], deux_telephones: Boolean(a.deux_telephones), source: "site", start_monday: a.start_monday,
  });
  if (!r.ok) {
    await admin.from("slideshow_applications").update({ os_error: r.error }).eq("id", a.id);
    return { ok: false, error: r.error };
  }
  const managerName = r.manager ? `${r.manager.prenom} ${r.manager.nom}`.trim() : null;
  await admin.from("slideshow_applications").update({
    status: "os_created", os_created_at: new Date().toISOString(), os_profile_id: r.profile_id, os_email: r.email_os, os_error: null,
    manager_name: managerName, manager_email: r.manager?.email ?? null,
  }).eq("id", a.id);
  if (!r.existed || !a.os_created_at) {
    const l = pickLang(a.langue);
    await posterEmails.logins(a.email, a.full_name, l, {
      osUrl: (await setting(admin, "os_app_url")) ?? "https://sophia-marketing-orga.vercel.app",
      login: r.email_os, password: r.password, slack: await setting(admin, "slideshow_slack_invite_url"), guide: await setting(admin, "slideshow_poster_guide_url"), monday: a.start_monday,
    });
    await notifyManager(admin, { name: a.full_name, country: a.country, monday: a.start_monday, managerEmail: r.manager?.email ?? null });
    await admin.from("slideshow_applications").update({ hm_notified_at: new Date().toISOString() }).eq("id", a.id);
  }
  return { ok: true };
}

async function notifyManager(admin: Admin, o: { name: string; country: string; monday: string; managerEmail: string | null }) {
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${o.monday}T12:00:00Z`));
  const text = `New poster from the site in your zone: ${o.name}, ${o.country}, starts Monday ${date}. Logins sent. Add them to your zone channel.`;
  const hook = process.env["SLACK_WEBHOOK_URL"];
  if (hook) {
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => null);
    if (res?.ok) return;
  }
  if (o.managerEmail) await sendBrevoEmail({ to: o.managerEmail, subject: `New poster: ${o.name}`, html: `<p>${text}</p>`, text });
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

/** Monday 07:00 Paris: build the week just ended for every started poster. Posters without OS data are skipped and say so. */
export async function buildWeek(admin: Admin, lundi = addDays(mondayOf(), -7)) {
  const [{ data: posters }, { data: zones }] = await Promise.all([
    admin.from("slideshow_applications").select("id, zone, start_monday, os_profile_id").eq("status", "started"),
    admin.from("pay_zones").select("zone, weekly_amount"),
  ]);
  const rate: Record<string, number> = Object.fromEntries((zones ?? []).map((z: any) => [z.zone, Number(z.weekly_amount ?? 0)]));
  let built = 0, skipped = 0;
  for (const p of posters ?? []) {
    const { data: existing } = await admin.from("slideshow_payouts").select("id, status").eq("application_id", p.id).eq("week_start", lundi).maybeSingle();
    if (existing && existing.status !== "draft" && existing.status !== "skipped") continue;
    const { data: snap } = p.os_profile_id ? await admin.from("os_snapshots").select("*").eq("os_profile_id", p.os_profile_id).eq("lundi", lundi).maybeSingle() : { data: null };
    const { data: carried } = await admin.from("slideshow_payouts").select("id, amount, carried_in").eq("application_id", p.id).eq("status", "carried").lt("week_start", lundi);
    const carriedIn = (carried ?? []).reduce((s: number, c: any) => s + Number(c.amount ?? 0) + Number(c.carried_in ?? 0), 0);
    const first = p.start_monday === lundi;
    const base = rate[p.zone] ?? 0;
    const row: Record<string, unknown> = { application_id: p.id, week_start: lundi, zone: p.zone, rate: base, first_week: first };
    if (!snap) {
      Object.assign(row, { status: "skipped", skip_reason: "No OS data for this week (not connected or no snapshot)", suggested: null, amount: null, carried_in: 0 });
      skipped++;
    } else {
      const missed = Number(snap.manques ?? 0);
      const suggested = Math.max(0, base + (first ? 1 : 0) - Math.max(0, missed - 1));
      Object.assign(row, { status: "draft", skip_reason: null, prevus: snap.prevus, publies: snap.publies, manques: missed, suggested, amount: suggested, carried_in: carriedIn });
      built++;
    }
    await admin.from("slideshow_payouts").upsert(row, { onConflict: "application_id,week_start" });
    if (snap && carried?.length) await admin.from("slideshow_payouts").update({ status: "rolled" }).in("id", carried.map((c: any) => c.id));
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
