import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeMonth, currentPeriod, paceTarget, platformAllowed, periodBounds } from "./ugc-pay";

async function adminId(context: any): Promise<string> {
  const { data } = await context.supabase.from("profiles").select("id, role").eq("user_id", context.userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return data.id;
}
const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin as any;

/* ---------- C. Dashboard ---------- */
export const adminUgcDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminId(context);
    const a = await db();
    const period = currentPeriod();
    const { start, end } = periodBounds(period);
    const { activeRateCard } = await import("./ugc-month.server");
    const [{ data: creators }, rate, { data: s }] = await Promise.all([
      a.from("creators").select("id, full_name, email, country, ugc_status, posts_per_month, required_platforms, fixed_monthly_override, per_post_override, rpm_override, cap_override, tiktok_handle, instagram_handle, last_seen_at, sync_status, sync_error, sync_checked_at, assigned_hm_id, user_id").eq("track", "ugc").neq("status", "pending").order("full_name"),
      activeRateCard(a, period),
      a.from("ugc_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    const ids = (creators ?? []).map((c: any) => c.id);
    const { data: posts } = ids.length
      ? await a.from("external_posts").select("id, creator_id, platform, url, posted_at, views, views_7d, views_7d_at, excluded").in("creator_id", ids).gte("posted_at", new Date(start.getTime() - 8 * 86400000).toISOString())
      : { data: [] };
    const def = s?.default_posts_per_month ?? 20;
    const now = Date.now();
    const rows = (creators ?? []).map((c: any) => {
      const mine = (posts ?? []).filter((p: any) => p.creator_id === c.id);
      const month = mine.filter((p: any) => p.posted_at && new Date(p.posted_at) >= start && new Date(p.posted_at) < end && !p.excluded);
      const target = c.posts_per_month ?? def;
      const tt = month.filter((p: any) => p.platform === "tiktok").length;
      const ig = month.filter((p: any) => p.platform === "instagram").length;
      const counted = month.filter((p: any) => platformAllowed(c.required_platforms, p.platform)).length;
      const last = mine.reduce((m: string | null, p: any) => (p.posted_at && (!m || p.posted_at > m) ? p.posted_at : m), null);
      const viewsMissing = mine.filter((p: any) => p.views_7d == null && p.posted_at && now - new Date(p.posted_at).getTime() > 8 * 86400000).length;
      const b = computeMonth(period, c, rate, def, mine);
      return {
        ...c, target, tiktok: tt, instagram: ig, counted, pace: paceTarget(target), behind: counted < Math.floor(paceTarget(target)),
        views: month.reduce((sum: number, p: any) => sum + Number(p.views_7d ?? p.views ?? 0), 0),
        projected: b.total, lastPost: last, viewsMissing,
        daysSinceLogin: c.last_seen_at ? Math.floor((now - new Date(c.last_seen_at).getTime()) / 86400000) : null,
      };
    });
    return { period, rows, currency: rate.currency };
  });

export const saveCreatorUgcSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    creatorId: z.string().uuid(),
    posts_per_month: z.number().int().min(0).max(200).nullable(),
    required_platforms: z.enum(["tiktok", "instagram", "both"]),
    ugc_status: z.enum(["trial", "active", "paused", "ended"]),
    fixed_monthly_override: z.number().min(0).max(100000).nullable(),
    per_post_override: z.number().min(0).max(10000).nullable().optional(),
    rpm_override: z.number().min(0).max(1000).nullable(),
    cap_override: z.number().min(0).max(100000).nullable(),
    assigned_hm_id: z.string().uuid().nullable(),
    admin_notes: z.string().max(8000).nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    const { creatorId, ...patch } = data;
    const { error } = await a.from("creators").update(patch).eq("id", creatorId);
    if (error) throw new Error("Settings could not be saved.");
    await a.from("activity_log").insert({ actor_id: me, entity: "creator", entity_id: creatorId, action: "ugc_settings_saved", comment: JSON.stringify(patch).slice(0, 500) });
    return { ok: true };
  });

export const bulkMessageCreators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorIds: z.array(z.string().uuid()).min(1).max(500), body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    await adminId(context);
    const a = await db();
    await a.from("creator_messages").insert(data.creatorIds.map((id) => ({ creator_id: id, from_admin: true, body: data.body })));
    return { sent: data.creatorIds.length };
  });

export const requestCreatorResign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    await a.from("creators").update({ resign_required_at: new Date().toISOString() }).eq("id", data.creatorId);
    await a.from("creator_notifications").insert({ creator_id: data.creatorId, body: "Please re-sign the updated Creator Account Agreement (version 3) in your space." });
    await a.from("activity_log").insert({ actor_id: me, entity: "creator", entity_id: data.creatorId, action: "resign_requested" });
    return { ok: true };
  });

/* ---------- B. Emails ---------- */
export const resendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await adminId(context);
    const a = await db();
    const { data: app } = await a.from("creator_applications").select("id, full_name, email, created_creator_id, country").eq("id", data.applicationId).maybeSingle();
    if (!app?.created_creator_id) throw new Error("Accept the application first.");
    const { data: c } = await a.from("creators").select("invite_token").eq("id", app.created_creator_id).maybeSingle();
    const url = `${data.origin.replace(/\/$/, "")}/creators/invite?token=${encodeURIComponent(c?.invite_token ?? "")}&email=${encodeURIComponent(app.email)}`;
    const { sendTemplated, emailLang } = await import("./ugc-email.server");
    const r = await sendTemplated(a, "ugc-welcome", app.email, app.full_name, url, emailLang(null, app.country));
    await a.from("creator_applications").update({
      acceptance_email_sent_at: r.sent ? new Date().toISOString() : undefined,
      welcome_email_provider: r.provider, welcome_email_message_id: r.messageId, welcome_email_error: r.note,
    }).eq("id", app.id);
    return r;
  });

export const rejectUgcApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: z.string().uuid(), reason: z.string().max(2000).optional(), notify: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    const { data: app } = await a.from("creator_applications").select("id, full_name, email, country").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found.");
    await a.from("creator_applications").update({ status: "rejected", rejection_reason: data.reason || null, decided_at: new Date().toISOString(), decided_by: me }).eq("id", app.id);
    if (!data.notify) return { sent: false, note: null };
    const { sendTemplated, emailLang } = await import("./ugc-email.server");
    const r = await sendTemplated(a, "ugc-decline", app.email, app.full_name, undefined, emailLang(null, app.country));
    if (r.sent) await a.from("creator_applications").update({ decline_email_sent_at: new Date().toISOString(), decline_email_message_id: r.messageId }).eq("id", app.id);
    return { sent: r.sent, note: r.note };
  });

export const getEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminId(context);
    const a = await db();
    const { loadTemplate } = await import("./ugc-email.server");
    return { welcome: await loadTemplate(a, "ugc-welcome"), decline: await loadTemplate(a, "ugc-decline") };
  });

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    key: z.enum(["ugc-welcome", "ugc-decline"]), subject: z.string().trim().min(1).max(160),
    intro: z.string().trim().min(1).max(4000), instructions: z.string().trim().max(6000), button_label: z.string().trim().max(80),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    const { key, ...rest } = data;
    const { error } = await a.from("creator_email_settings").upsert({ template_key: key, ...rest, updated_by: me }, { onConflict: "template_key" });
    if (error) throw new Error("Template could not be saved.");
    return { ok: true };
  });

/* ---------- F. Sync ---------- */
export const runComplianceNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await adminId(context);
    if (!process.env["APIFY_TOKEN"]) throw new Error("APIFY_TOKEN is not set yet. Add it in Integrations setup.");
    const { runComplianceSync } = await import("./ugc-sync.server");
    return runComplianceSync(await db(), data.creatorId);
  });

export const runD7Now = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminId(context);
    if (!process.env["APIFY_TOKEN"]) throw new Error("APIFY_TOKEN is not set yet. Add it in Integrations setup.");
    const { runD7Sync } = await import("./ugc-sync.server");
    return runD7Sync(await db());
  });

export const integrationsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminId(context);
    const a = await db();
    const [{ data: s }, { data: creators }, { data: runs }] = await Promise.all([
      a.from("ugc_settings").select("*").eq("id", 1).maybeSingle(),
      a.from("creators").select("posts_per_month, required_platforms").eq("track", "ugc").in("ugc_status", ["trial", "active"]),
      a.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(20),
    ]);
    const def = s?.default_posts_per_month ?? 20;
    const price = Number(s?.apify_price_per_result_usd ?? 0.0003);
    const perCall = Number(s?.posts_per_profile_call ?? 30);
    const profiles = (creators ?? []).reduce((n: number, c: any) => n + (c.required_platforms === "both" ? 2 : 1), 0);
    const postsMonth = (creators ?? []).reduce((n: number, c: any) => n + (c.posts_per_month ?? def), 0);
    const weekly = profiles * 4 * perCall * price;
    const d7 = postsMonth * perCall * price; // each D+7 refresh is one profile call returning ~perCall results
    return {
      secrets: { BREVO_API_KEY: !!process.env["BREVO_API_KEY"], APIFY_TOKEN: !!process.env["APIFY_TOKEN"], STRIPE_SECRET_KEY: !!process.env["STRIPE_SECRET_KEY"], LOVABLE_CRON_SECRET: !!process.env["LOVABLE_CRON_SECRET"] },
      estimate: { profiles, postsMonth, price, perCall, weeklyUsd: weekly, d7Usd: d7, totalUsd: weekly + d7 },
      settings: s, runs: runs ?? [],
    };
  });

/* ---------- F/G. Post-level admin control ---------- */
export const updateExternalPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    excluded: z.boolean().optional(), exclude_reason: z.string().max(500).nullable().optional(),
    views_7d: z.number().int().min(0).nullable().optional(),
    acceptManual: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    const patch: Record<string, unknown> = {};
    if (data.excluded !== undefined) { patch["excluded"] = data.excluded; patch["exclude_reason"] = data.exclude_reason ?? null; }
    if (data.views_7d !== undefined) { patch["views_7d"] = data.views_7d; patch["views_7d_at"] = new Date().toISOString(); patch["views_7d_source"] = "admin"; }
    if (data.acceptManual) {
      const { data: row } = await a.from("external_posts").select("manual_views_7d").eq("id", data.id).maybeSingle();
      if (row?.manual_views_7d == null) throw new Error("No manual figure to accept.");
      Object.assign(patch, { views_7d: row.manual_views_7d, views_7d_at: new Date().toISOString(), views_7d_source: "manual", manual_accepted_at: new Date().toISOString() });
    }
    await a.from("external_posts").update(patch).eq("id", data.id);
    await a.from("activity_log").insert({ actor_id: me, entity: "external_post", entity_id: data.id, action: "external_post_updated", comment: JSON.stringify(patch).slice(0, 300) });
    return { ok: true };
  });

export const addManualExternalPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid(), platform: z.enum(["tiktok", "instagram"]), url: z.string().url(), posted_at: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await adminId(context);
    const a = await db();
    const { error } = await a.from("external_posts").insert({ creator_id: data.creatorId, platform: data.platform, url: data.url, external_id: `manual:${data.url}`, posted_at: new Date(data.posted_at).toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- G. Monthly pay ---------- */
const periodSchema = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) });

export const previewUgcMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => periodSchema.parse(d))
  .handler(async ({ data, context }) => {
    await adminId(context);
    const { previewMonth } = await import("./ugc-month.server");
    return previewMonth(await db(), data.period);
  });

export const generateUgcMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => periodSchema.parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const { generateMonth } = await import("./ugc-month.server");
    return generateMonth(await db(), data.period, me);
  });

export const addPayoutAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ creatorId: z.string().uuid(), period: z.string().regex(/^\d{4}-\d{2}$/), amount: z.number().min(-100000).max(100000), reason: z.string().trim().min(2).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    await a.from("payout_adjustments").insert({ creator_id: data.creatorId, period: data.period, amount: data.amount, reason: data.reason, created_by: me });
    return { ok: true };
  });

export const saveRateCardAndDefaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    fixed_monthly: z.number().min(0), rpm_eur_per_1000: z.number().min(0), cap_per_video: z.number().min(0), prorate_fixed_by_quota: z.boolean(),
    effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), default_posts_per_month: z.number().int().min(1).max(200), payday_day: z.number().int().min(1).max(28),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await adminId(context);
    const a = await db();
    const { default_posts_per_month, payday_day, ...card } = data;
    await a.from("ugc_rate_cards").insert({ ...card, currency: "EUR" });
    await a.from("ugc_settings").update({ default_posts_per_month, payday_day, updated_at: new Date().toISOString() }).eq("id", 1);
    return { ok: true };
  });

/* ---------- I. Week planner ---------- */
export const publishWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await adminId(context);
    const a = await db();
    const { data: rows } = await a.from("brief_assignments").select("id, creator_id, brief_id, target_date, briefs(title, status)").eq("week_start", data.weekStart).is("published_at", null);
    if (!rows?.length) throw new Error("Nothing planned for that week.");
    const briefIds = [...new Set(rows.map((r: any) => r.brief_id))];
    await a.from("briefs").update({ status: "published" }).in("id", briefIds).eq("status", "draft");
    await a.from("brief_assignments").update({ published_at: new Date().toISOString() }).in("id", rows.map((r: any) => r.id));
    const byCreator = new Map<string, any[]>();
    rows.forEach((r: any) => byCreator.set(r.creator_id, [...(byCreator.get(r.creator_id) ?? []), r]));
    const notes = [...byCreator.entries()].map(([creator_id, list]) => ({
      creator_id,
      body: `Your briefs for the week of ${data.weekStart}: ` + list.sort((x, y) => String(x.target_date).localeCompare(String(y.target_date))).map((r) => `${r.target_date ?? "any day"} — ${r.briefs?.title ?? "brief"}`).join(" · "),
    }));
    await a.from("creator_notifications").insert(notes);
    await a.from("activity_log").insert({ actor_id: me, entity: "week", entity_id: me, action: "week_published", comment: `${data.weekStart}: ${rows.length} assignments, ${notes.length} creators` });
    return { assignments: rows.length, creators: notes.length };
  });
