import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: any): Promise<{ id: string; name: string }> {
  const { data: me } = await context.supabase.from("profiles").select("id, role, full_name, email").eq("user_id", context.userId).maybeSingle();
  if (me?.role !== "admin") throw new Error("Forbidden");
  return { id: me.id, name: me.full_name ?? me.email ?? "Admin" };
}
const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;
const id = z.string().uuid();

/** OS connection status for the Settings card and every OS-dependent screen. Never returns the secret. */
export const osStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const a = await admin();
    const { data } = await a.from("hub_settings").select("key, value").in("key", ["os_base_url", "os_last_sync", "os_last_error", "os_stats"]);
    const m = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
    const { data: calls } = await a.from("os_calls").select("action, ok, ms, error, created_at").order("created_at", { ascending: false }).limit(10);
    let stats: any = null;
    try { stats = m["os_stats"] ? JSON.parse(m["os_stats"]) : null; } catch { stats = null; }
    return {
      connected: Boolean(process.env["OS_HUB_SECRET"]),
      slack: Boolean(process.env["SLACK_WEBHOOK_URL"]),
      baseUrl: m["os_base_url"] ?? "https://mbikecieskoobeizixig.supabase.co",
      lastSync: m["os_last_sync"] ?? null, lastError: m["os_last_error"] ?? null,
      byLangue: (stats?.by_langue ?? []) as { langue: string; actifs: number }[],
      calls: calls ?? [],
    };
  });

export const saveOsBaseUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ url: z.string().url().startsWith("https://") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await (await admin()).from("hub_settings").upsert({ key: "os_base_url", value: data.url.replace(/\/+$/, ""), updated_at: new Date().toISOString() });
    return { ok: true };
  });

export const getAutoAccept = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { autoAcceptEnabled } = await import("./slideshow-auto-accept.server");
    return { enabled: await autoAcceptEnabled(await admin()) };
  });

export const setAutoAccept = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await (await admin()).from("hub_settings").upsert({ key: "slides_auto_accept", value: String(data.enabled), updated_at: new Date().toISOString() });
    return { enabled: data.enabled };
  });

export const testOsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { callOs } = await import("./os-bridge.server");
    const r = await callOs<{ version?: string }>(await admin(), "ping", {});
    return r.ok ? { ok: true as const, version: r.version ?? null } : { ok: false as const, error: r.error, notConnected: Boolean((r as any).notConnected) };
  });

export const refreshFromOs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { refreshSnapshots } = await import("./slideshows.server");
    return refreshSnapshots(await admin());
  });

async function stamp(a: any, appId: string, key: string, by: string, patch: Record<string, unknown> = {}) {
  const { data } = await a.from("slideshow_applications").select("timeline").eq("id", appId).maybeSingle();
  const timeline = { ...(data?.timeline ?? {}), [key]: { at: new Date().toISOString(), by } };
  await a.from("slideshow_applications").update({ ...patch, timeline }).eq("id", appId);
}

/** Admin "Send signature reminder" (single or bulk): skips signed, refused, expired or unsubscribed applications. */
export const sendSignatureReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationIds: z.array(id).min(1).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const { sendManualReminders } = await import("./slideshow-reminders.server");
    return sendManualReminders(await admin(), data.applicationIds, me.name);
  });

/** Accept: choose app(s), confirm zone; sets start Monday, creates the contract link and emails the applicant. */
export const acceptPoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id, apps: z.array(z.enum(["sophia", "unswipe"])).min(1), zone: z.enum(["A", "B", "C"]), langue: z.enum(["fr", "en", "es", "it", "pt", "de"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const { acceptSlideshowApplication } = await import("./slideshow-accept.server");
    const r = await acceptSlideshowApplication(await admin(), data, { id: me.id, name: me.name });
    return { ok: true, startMonday: r.startMonday, emailed: r.emailed, reason: r.reason };
  });

/** Accept all: same acceptance function, one by one; skips refusals and possible duplicates. */
export const acceptPostersBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationIds: z.array(id).min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const { acceptMany } = await import("./slideshow-accept.server");
    return acceptMany(await admin(), data.applicationIds, { id: me.id, name: me.name });
  });

/** Accept all valid: dry run lists valid/skipped; otherwise accepts up to `limit` (oldest first) and returns `remaining`. */
export const acceptAllValid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ dryRun: z.boolean(), limit: z.number().int().min(1).max(50).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const { acceptAllValidRun } = await import("./slideshow-accept.server");
    return acceptAllValidRun(await admin(), { id: me.id, name: me.name }, data.dryRun, data.limit) as Promise<any>;
  });

/** Legal names typed by posters in the Sophia OS onboarding (Ruul checks them against the ID). */
export const osIdentities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ hubIds: z.array(id).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.hubIds.length || !process.env["OS_HUB_SECRET"]) return { rows: [] as { hub_id: string; prenom_legal: string; nom_legal: string }[] };
    const { callOs } = await import("./os-bridge.server");
    const r = await callOs<{ rows?: { hub_id: string; prenom_legal: string | null; nom_legal: string | null }[] }>(await admin(), "identites", { hub_ids: data.hubIds });
    // "action inconnue" (OS not updated yet) or any failure: everyone stays waiting for the legal name.
    if (!r.ok) return { rows: [] };
    return { rows: (r.rows ?? []).filter((x) => x.prenom_legal && x.nom_legal).map((x) => ({ hub_id: x.hub_id, prenom_legal: String(x.prenom_legal), nom_legal: String(x.nom_legal) })) };
  });

/** OS zones for the Accept button (cached 10 min server-side). */
export const osZones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    if (!process.env["OS_HUB_SECRET"]) return { ok: false as const, ouverts: [], fermes: [] };
    const { getOsZones } = await import("./slideshows.server");
    return getOsZones(await admin());
  });

/** Admin edits the payout channel (upwork | ruul) on the card. */
export const setPayoutChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id, channel: z.enum(["upwork", "ruul"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await (await admin()).from("slideshow_applications").update({ payout_channel: data.channel }).eq("id", data.applicationId);
    return { ok: true };
  });

/** Admin edits the email used for the Ruul account. */
export const saveRuulEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id, email: z.string().trim().email().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const a = await admin();
    const { data: row } = await a.from("slideshow_applications").select("timeline").eq("id", data.applicationId).maybeSingle();
    const timeline = { ...((row?.timeline as object) ?? {}), ruul_email: { at: new Date().toISOString(), by: me.name } };
    await a.from("slideshow_applications").update({ ruul_email: data.email.toLowerCase(), timeline }).eq("id", data.applicationId);
    return { ok: true };
  });

/** "Added in Ruul" / "Resend": stamps ruul_added_at (first time) and emails the Ruul signup instructions. */
export const markRuulAdded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const a = await admin();
    const { data: app } = await a.from("slideshow_applications").select("id, ruul_added_at").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Not found");
    // Records only; the Ruul instructions go in the logins email.
    if (!app.ruul_added_at) await a.from("slideshow_applications").update({ ruul_added_at: new Date().toISOString() }).eq("id", app.id);
    return { ok: true };
  });

export const rejectPoster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id, reason: z.string().trim().max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const a = await admin();
    const { posterEmails, pickLang } = await import("./slideshow-emails.server");
    const { data: app } = await a.from("slideshow_applications").select("*").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found");
    await a.from("slideshow_applications").update({ status: "rejected", rejected_reason: data.reason || null, rejection_reason: data.reason || null, decided_at: new Date().toISOString(), decided_by: me.id }).eq("id", app.id);
    await stamp(a, app.id, "rejected", me.name);
    const sent = await posterEmails.rejected(app.email, app.full_name, pickLang(app.langue), data.reason || null);
    return { ok: true, emailed: sent.sent };
  });

export const keepWarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const a = await admin();
    await a.from("slideshow_applications").update({ status: "pool", pool_at: new Date().toISOString() }).eq("id", data.applicationId).in("status", ["pending"]);
    await stamp(a, data.applicationId, "pool", me.name);
    return { ok: true };
  });

/** Manual checklist tick/untick on the card. */
export const tickStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id, step: z.enum(["accepted", "contract_signed", "os_created", "logins_sent", "slack_added", "hm_notified", "warmup", "started", "dropped"]), done: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const a = await admin();
    const { data: app } = await a.from("slideshow_applications").select("timeline, status").eq("id", data.applicationId).maybeSingle();
    const timeline = { ...(app?.timeline ?? {}) };
    if (data.done) timeline[data.step] = { at: new Date().toISOString(), by: me.name }; else delete timeline[data.step];
    const patch: Record<string, unknown> = { timeline };
    if (data.step === "dropped" && data.done) Object.assign(patch, { status: "dropped", dropped_at: new Date().toISOString() });
    // Manual flow: ticking "Create the OS account" moves a signed poster on, so Posters and weekly pay pick them up.
    if (data.step === "os_created" && data.done && app?.status === "contract_signed") Object.assign(patch, { status: "os_created", os_created_at: new Date().toISOString() });
    if (data.step === "os_created" && !data.done && app?.status === "os_created") Object.assign(patch, { status: "contract_signed", os_created_at: null });
    if (data.step === "started" && data.done && app?.status === "os_created") Object.assign(patch, { status: "started", started_at: new Date().toISOString() });
    await a.from("slideshow_applications").update(patch).eq("id", data.applicationId);
    return { ok: true };
  });

export const retryOs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { createPosterInOs } = await import("./slideshows.server");
    return createPosterInOs(await admin(), data.applicationId);
  });

/** Emails (or re-emails) the 7-day payout-method link. */
export const sendPayoutLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: id }).parse(d))
  .handler(async ({ data, context }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    await assertAdmin(context);
    const a = await admin();
    const { randomToken, payoutLink } = await import("./slideshows.server");
    const { posterEmails, pickLang } = await import("./slideshow-emails.server");
    const { data: app } = await a.from("slideshow_applications").select("id, email, full_name, langue").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Not found");
    const token = randomToken();
    await a.from("slideshow_applications").update({ payout_token: token, payout_token_expires_at: new Date(Date.now() + 7 * 864e5).toISOString() }).eq("id", app.id);
    const sent = await posterEmails.payout(app.email, app.full_name, pickLang(app.langue), payoutLink(token));
    return { ok: true, emailed: sent.sent, link: payoutLink(token) };
  });

export const buildWeekNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lundi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { buildWeek } = await import("./slideshows.server");
    return buildWeek(await admin(), data.lundi);
  });

/** Approve a week: every draft row above 0 is approved (no per-poster minimum, paid every Monday); rows at 0 are skipped. */
export const approveWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lundi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await assertAdmin(context);
    const a = await admin();
    const { data: rows } = await a.from("slideshow_payouts").select("id, amount, carried_in").eq("week_start", data.lundi).eq("status", "draft");
    let approved = 0, skipped = 0;
    for (const r of rows ?? []) {
      const total = Number(r.amount ?? 0) + Number(r.carried_in ?? 0);
      if (total > 0) {
        await a.from("slideshow_payouts").update({ status: "approved", approved_by: me.id, approved_at: new Date().toISOString() }).eq("id", r.id);
        approved++;
      } else {
        await a.from("slideshow_payouts").update({ status: "skipped", skip_reason: "Nothing to pay this week" }).eq("id", r.id);
        skipped++;
      }
    }
    return { ok: true, approved, skipped };
  });

export const payWeekStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lundi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    await assertAdmin(context);
    const a = await admin();
    const { stripeClient } = await import("./slideshows.server");
    const s = await stripeClient();
    const { data: rows } = await a.from("slideshow_payouts").select("id, amount, carried_in, application_id, slideshow_applications(stripe_account_id, stripe_onboarded, payout_method)").eq("week_start", data.lundi).eq("status", "approved");
    let paid = 0, skipped = 0; const errors: string[] = [];
    for (const r of rows ?? []) {
      const p = r.slideshow_applications as any;
      if (!p?.stripe_onboarded || !p.stripe_account_id || (p.payout_method && p.payout_method !== "stripe")) { skipped++; continue; }
      const cents = Math.round((Number(r.amount ?? 0) + Number(r.carried_in ?? 0)) * 100);
      try {
        const t = await s.transfers.create({ amount: cents, currency: "usd", destination: p.stripe_account_id, metadata: { slideshow_payout_id: r.id } }, { idempotencyKey: `slideshow-payout-${r.id}` });
        await a.from("slideshow_payouts").update({ status: "paid", stripe_transfer_id: t.id, paid_at: new Date().toISOString() }).eq("id", r.id);
        paid++;
      } catch (e) { errors.push((e as Error).message.slice(0, 160)); }
    }
    return { ok: true, paid, skipped, errors };
  });

export const markWeekPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(id).min(1), ruulRef: z.string().trim().max(120).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await (await admin()).from("slideshow_payouts").update({ status: "paid", paid_at: new Date().toISOString(), ...(data.ruulRef ? { ruul_ref: data.ruulRef } : {}) }).in("id", data.ids).eq("status", "approved");
    return { ok: true };
  });

/* ---------- Public: poster payout-method page (7-day token, no login) ---------- */
const tok = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });
async function byToken(a: any, token: string) {
  const { data } = await a.from("slideshow_applications").select("id, full_name, email, langue, payout_method, paypal_email, wise_email, stripe_account_id, stripe_onboarded, payout_token_expires_at").eq("payout_token", token).maybeSingle();
  if (!data || !data.payout_token_expires_at || new Date(data.payout_token_expires_at) < new Date()) return null;
  return data;
}

export const getPosterPayout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tok.parse(d))
  .handler(async ({ data }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    const a = await admin();
    const p = await byToken(a, data.token);
    if (!p) return { state: "invalid" as const };
    let onboarded = Boolean(p.stripe_onboarded);
    if (p.stripe_account_id && !onboarded) {
      try {
        const { stripeClient } = await import("./slideshows.server");
        const acc = await (await stripeClient()).accounts.retrieve(p.stripe_account_id);
        onboarded = Boolean(acc.payouts_enabled && acc.details_submitted);
        if (onboarded) await a.from("slideshow_applications").update({ stripe_onboarded: true }).eq("id", p.id);
      } catch { /* keep current state */ }
    }
    return { state: "ready" as const, name: String(p.full_name).split(/\s+/)[0], lang: p.langue ?? "en", method: p.payout_method, paypal: p.paypal_email, wise: p.wise_email, stripeOnboarded: onboarded, stripeStarted: Boolean(p.stripe_account_id) };
  });

export const savePosterPayout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tok.extend({ method: z.enum(["paypal", "wise"]), email: z.string().trim().email().max(200) }).parse(d))
  .handler(async ({ data }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    const a = await admin();
    const p = await byToken(a, data.token);
    if (!p) throw new Error("This link has expired. Ask us for a new one.");
    await a.from("slideshow_applications").update({ payout_method: data.method, [data.method === "paypal" ? "paypal_email" : "wise_email"]: data.email.toLowerCase() }).eq("id", p.id);
    return { ok: true };
  });

export const startPosterStripe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tok.parse(d))
  .handler(async ({ data }) => {
    await (await import("./payments-gate.server")).assertPaymentsOn();
    const a = await admin();
    const p = await byToken(a, data.token);
    if (!p) throw new Error("This link has expired. Ask us for a new one.");
    const { stripeClient, payoutLink } = await import("./slideshows.server");
    const s = await stripeClient();
    let acct = p.stripe_account_id as string | null;
    if (!acct) {
      const created = await s.accounts.create({ type: "express", email: p.email, capabilities: { transfers: { requested: true } }, metadata: { slideshow_application_id: p.id } }, { idempotencyKey: `poster-account-${p.id}` });
      acct = created.id;
      await a.from("slideshow_applications").update({ stripe_account_id: acct, payout_method: "stripe" }).eq("id", p.id);
    }
    const link = await s.accountLinks.create({ account: acct, refresh_url: payoutLink(data.token), return_url: payoutLink(data.token), type: "account_onboarding" });
    return { url: link.url };
  });
