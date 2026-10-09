// Server-only: phase-3 automation (daily post detection, fraud flags, budget cap, dormancy, brief drops).
import { clean, scrapeInstagram, scrapeTikTok, settings, upsertFound, type Found } from "./ugc-sync.server";
import { previewMonth } from "./ugc-month.server";
import { sendBrevoEmail } from "./brevo.server";
import { buildEmailHtml, buildEmailText } from "./email-send.server";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const DAY = 86400_000;
const MAX_CREATORS_PER_RUN = 40;

const period = (d = new Date()) => d.toISOString().slice(0, 7);
const nextPeriod = (p: string) => { const [y, m] = p.split("-").map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`; };

/** Single-flight lease so overlapping cron calls never run the same job twice. */
export async function withLock<T>(admin: Admin, name: string, minutes: number, fn: () => Promise<T>): Promise<T | { skipped: string }> {
  const now = new Date();
  const { data: row } = await admin.from("job_locks").select("locked_until").eq("name", name).maybeSingle();
  if (row && new Date(row.locked_until) > now) return { skipped: "already running" };
  await admin.from("job_locks").upsert({ name, locked_until: new Date(now.getTime() + minutes * 60_000).toISOString() });
  try { return await fn(); } finally { await admin.from("job_locks").update({ locked_until: new Date().toISOString() }).eq("name", name); }
}

/** Budget cap: true when this month's computed spend has reached ugc_settings.monthly_budget_cap. Closes/reopens the job feed. */
export async function applyBudgetCap(admin: Admin) {
  const { data: s } = await admin.from("ugc_settings").select("monthly_budget_cap").eq("id", 1).maybeSingle();
  const cap = s?.monthly_budget_cap == null ? null : Number(s.monthly_budget_cap);
  if (!cap) {
    await admin.from("jobs").update({ status: "active", closed_by_budget: false }).eq("closed_by_budget", true);
    return { capped: false, spend: 0, cap: null as number | null };
  }
  const rows = await previewMonth(admin, period());
  const spend = rows.reduce((a, r) => a + Number(r.breakdown.total ?? 0), 0);
  const capped = spend >= cap;
  if (capped) await admin.from("jobs").update({ status: "paused", closed_by_budget: true }).eq("status", "active").eq("access", "job_feed");
  else await admin.from("jobs").update({ status: "active", closed_by_budget: false }).eq("closed_by_budget", true);
  return { capped, spend, cap };
}

function fraudFlags(f: Found, recentCount: number, dupCaption: boolean) {
  const flags: string[] = [];
  if (recentCount >= 5) flags.push("velocity: 5+ posts in 24h");
  if (dupCaption) flags.push("duplicate: same caption as another creator's post");
  const v = Number(f.views ?? 0), l = Number(f.likes ?? 0);
  if (v >= 5000 && l / v < 0.002) flags.push("ratio: very few likes for the views");
  if (v > 0 && l > v) flags.push("ratio: more likes than views");
  return flags;
}

async function storeDetected(admin: Admin, c: any, found: Found[], capped: boolean) {
  const today = new Date().toISOString().slice(0, 10);
  let created = 0, flagged = 0;
  const { data: app } = await admin.from("creator_apps").select("app_id").eq("creator_id", c.id).eq("status", "active").limit(1).maybeSingle();
  for (const f of found) {
    if (!f.external_id) continue;
    const { data: existing } = await admin.from("creator_posts").select("id").eq("creator_id", c.id)
      .or(`external_id.eq.${f.external_id}${f.url ? `,url.eq.${f.url}` : ""}`).limit(1).maybeSingle();
    let postId = existing?.id as string | undefined;
    if (!postId) {
      const postedAt = f.posted_at ? new Date(f.posted_at) : new Date();
      if (Date.now() - postedAt.getTime() > 30 * DAY) continue; // only new content is auto-logged
      const since = new Date(postedAt.getTime() - DAY).toISOString().slice(0, 10);
      const { count } = await admin.from("creator_posts").select("id", { count: "exact", head: true }).eq("creator_id", c.id).gte("posted_on", since);
      let dup = false;
      if (f.caption && f.caption.trim().length > 20) {
        const { data: d } = await admin.from("creator_posts").select("id").neq("creator_id", c.id).eq("caption", f.caption).limit(1);
        dup = Boolean(d?.length);
      }
      const flags = fraudFlags(f, count ?? 0, dup);
      const { data: ins, error } = await admin.from("creator_posts").insert({
        creator_id: c.id, app_id: app?.app_id ?? null, platform: f.platform, url: f.url, external_id: f.external_id,
        posted_on: postedAt.toISOString().slice(0, 10), status: "pending", auto_detected: true, caption: f.caption,
        views: f.views, likes: f.likes, comments: f.comments, shares: f.shares, format: f.duration ? "video" : null,
        fraud_flags: flags, hold_reason: flags.length ? "Fraud check" : capped ? "Budget cap reached — counts next month" : null,
        queued_period: capped ? nextPeriod(period()) : null,
      }).select("id").single();
      if (error) continue;
      postId = ins.id; created++; if (flags.length) flagged++;
    } else {
      await admin.from("creator_posts").update({ views: f.views, likes: f.likes, comments: f.comments, shares: f.shares, external_id: f.external_id }).eq("id", postId);
    }
    await admin.from("post_metrics_daily").upsert({ post_id: postId, app_id: app?.app_id ?? null, day: today, views: f.views ?? 0, likes: f.likes ?? 0, comments: f.comments ?? 0, shares: f.shares ?? 0 }, { onConflict: "post_id,day" });
  }
  return { created, flagged };
}

/** Daily 06:00: scrape every registered handle, auto-create creator_posts and write post_metrics_daily. */
export async function runDailyDetect(admin: Admin) {
  return withLock(admin, "daily-detect", 30, async () => {
    const s = await settings(admin);
    const budget = await applyBudgetCap(admin);
    const { data: run } = await admin.from("sync_runs").insert({ job: "daily-detect" }).select("id").single();
    const { data: creators } = await admin.from("creators").select("id, tiktok_handle, instagram_handle, required_platforms, sync_checked_at")
      .eq("track", "ugc").not("user_id", "is", null).or("tiktok_handle.not.is.null,instagram_handle.not.is.null")
      .order("sync_checked_at", { ascending: true, nullsFirst: true }).limit(MAX_CREATORS_PER_RUN);
    let items = 0, created = 0, flagged = 0;
    const errs: string[] = [];
    for (const c of creators ?? []) {
      for (const [plat, h] of [["tiktok", c.tiktok_handle], ["instagram", c.instagram_handle]] as const) {
        if (!h) continue;
        try {
          const found = plat === "tiktok" ? await scrapeTikTok(s.apify_tiktok_actor, clean(h), s.posts_per_profile_call) : await scrapeInstagram(s.apify_instagram_actor, clean(h));
          items += found.length;
          await upsertFound(admin, c.id, found); // keeps the D+7 freeze source up to date
          const r = await storeDetected(admin, c, found, budget.capped);
          created += r.created; flagged += r.flagged;
        } catch (e) { errs.push(`${plat} @${h}: ${(e as Error).message}`); }
      }
      await admin.from("creators").update({ sync_checked_at: new Date().toISOString(), sync_status: errs.length ? "partial" : "ok" }).eq("id", c.id);
    }
    const cost = items * Number(s.apify_price_per_result_usd ?? 0.0003);
    await admin.from("sync_runs").update({ status: errs.length ? (items ? "partial" : "failed") : "ok", items, cost_usd: cost, error: errs.join("\n").slice(0, 2000) || null, finished_at: new Date().toISOString() }).eq("id", run.id);
    return { creators: creators?.length ?? 0, items, created, flagged, budget, errors: errs.length };
  });
}

async function remind(admin: Admin, c: any, kind: "d3" | "d7") {
  if (!c.email) return false;
  const first = String(c.full_name ?? "").split(/\s+/)[0] || "there";
  const paragraphs = kind === "d3"
    ? [`Hi ${first},`, "We haven't seen a new post from you for 3 days. Your next video is waiting: open your creator space for this week's briefs.", "Posting regularly keeps your account growing and your earnings coming."]
    : [`Hi ${first},`, "It's been a week without a post. If something is blocking you, reply to this email and we'll help.", "If there is still no post after 14 days, the account goes back to the team so another creator can use it."];
  const opts = { paragraphs, buttonLabel: "Open my creator space", buttonUrl: "https://sophia-culture.com/creators/app/briefs" };
  const r = await sendBrevoEmail({ to: c.email, toName: c.full_name, subject: kind === "d3" ? "Your next video is waiting" : "We miss your videos", html: buildEmailHtml(opts), text: buildEmailText(opts) });
  return r.sent;
}

/** Daily: 72h without a post → dormant + reminders at day 3 and day 7; 14 days → accounts back to the pool with a password-rotation task. */
export async function runDormancy(admin: Admin) {
  return withLock(admin, "dormancy", 15, async () => {
    const { data: creators } = await admin.from("creators").select("id, full_name, email, tiktok_handle, instagram_handle, onboarding_completed_at, dormant_at, dormancy_reminders, ugc_status")
      .eq("track", "ugc").not("onboarding_completed_at", "is", null).limit(500);
    const now = Date.now();
    let dormant = 0, reminders = 0, pooled = 0;
    for (const c of creators ?? []) {
      const { data: last } = await admin.from("creator_posts").select("posted_on, created_at").eq("creator_id", c.id).order("posted_on", { ascending: false }).limit(1).maybeSingle();
      const lastAt = last ? new Date(last.posted_on ?? last.created_at).getTime() : new Date(c.onboarding_completed_at).getTime();
      const idle = now - lastAt;
      const rem = (c.dormancy_reminders ?? {}) as Record<string, string>;
      if (idle < 3 * DAY) {
        if (c.dormant_at) await admin.from("creators").update({ dormant_at: null, dormancy_reminders: {}, last_post_at: new Date(lastAt).toISOString() }).eq("id", c.id);
        continue;
      }
      const patch: Record<string, unknown> = { last_post_at: new Date(lastAt).toISOString() };
      if (!c.dormant_at) { patch.dormant_at = new Date().toISOString(); dormant++; }
      if (!rem.d3 && await remind(admin, c, "d3")) { rem.d3 = new Date().toISOString(); reminders++; }
      if (idle >= 7 * DAY && !rem.d7 && await remind(admin, c, "d7")) { rem.d7 = new Date().toISOString(); reminders++; }
      if (idle >= 14 * DAY && !rem.pooled) {
        const { data: app } = await admin.from("creator_apps").select("app_id").eq("creator_id", c.id).limit(1).maybeSingle();
        for (const [platform, handle] of [["tiktok", c.tiktok_handle], ["instagram", c.instagram_handle]] as const) {
          if (!handle) continue;
          await admin.from("account_pool").insert({ app_id: app?.app_id ?? null, platform, handle, from_creator_id: c.id, status: "needs_rotation", note: "Returned after 14 days without a post. Rotate the password before reassigning." });
          pooled++;
        }
        rem.pooled = new Date().toISOString();
        patch.ugc_status = "dormant";
        const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
        await admin.from("notifications").insert((admins ?? []).map((p: any) => ({ profile_id: p.id, type: "message", body: `${c.full_name}: no post for 14 days. Accounts are back in the pool — rotate the passwords, then reassign from Discover.` })));
      }
      patch.dormancy_reminders = rem;
      await admin.from("creators").update(patch).eq("id", c.id);
    }
    return { checked: creators?.length ?? 0, dormant, reminders, pooled };
  });
}

/** Monday 09:00 Paris: publish briefs scheduled for the drop and notify enrolled creators. */
export async function runBriefDrop(admin: Admin) {
  return withLock(admin, "brief-drop", 10, async () => {
    const { data: due } = await admin.from("briefs").select("id, title, app_id").eq("status", "scheduled").lte("drop_at", new Date().toISOString()).limit(100);
    let notified = 0;
    for (const b of due ?? []) {
      await admin.from("briefs").update({ status: "published" }).eq("id", b.id);
      const { data: enrolled } = await admin.from("creator_apps").select("creator_id").eq("app_id", b.app_id).eq("status", "active");
      const rows = (enrolled ?? []).map((e: any) => ({ creator_id: e.creator_id, body: `New brief this week: ${b.title}` }));
      if (rows.length) { await admin.from("creator_notifications").insert(rows); notified += rows.length; }
    }
    return { published: due?.length ?? 0, notified };
  });
}

/** Referral lines: 10% of each referee's month total while inside their 60-day window. Written as payout adjustments for the referrer. */
export async function referralAdjustments(admin: Admin, p: string, rows: { creatorId: string; breakdown: { total: number } }[]) {
  await admin.from("payout_adjustments").delete().eq("period", p).like("reason", "Referral:%");
  const start = new Date(`${p}-01T00:00:00Z`);
  const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
  const { data: refs } = await admin.from("referrals").select("*, referee:creators!referrals_referee_creator_id_fkey(full_name)").lt("starts_at", end.toISOString()).gt("ends_at", start.toISOString());
  let lines = 0;
  for (const r of refs ?? []) {
    const total = Number(rows.find((x) => x.creatorId === r.referee_creator_id)?.breakdown.total ?? 0);
    const amount = Math.round(total * Number(r.rate) * 100) / 100;
    if (amount <= 0) continue;
    await admin.from("payout_adjustments").insert({ creator_id: r.referrer_creator_id, period: p, amount, reason: `Referral: 10% of ${r.referee?.full_name ?? "a referred creator"}'s ${p} earnings` });
    await admin.from("referrals").update({ earned: Number(r.earned ?? 0) + amount }).eq("id", r.id);
    lines++;
  }
  return lines;
}
