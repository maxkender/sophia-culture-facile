// Server-only UGC loop: daily view tracking of validated posts, J+7 freeze and per-post pay.
import { ratePerEffort, type Effort, type TierTerms } from "./ugc-tiers";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const DAY = 86400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const k = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}k` : String(v));

/** Monday 00:00 Paris of the week containing `d`, as an ISO instant. */
export function parisWeekStart(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  const local = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00Z`);
  local.setUTCDate(local.getUTCDate() - wd);
  const offset = new Date(local.toLocaleString("en-US", { timeZone: "Europe/Paris" })).getTime() - new Date(local.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(local.getTime() - offset).toISOString();
}

/** Pay for one post: per-post by format + RPM on frozen views, views part capped per post. */
export async function priceFor(a: Admin, post: { creator_id: string; app_id: string; platform: string; effort: string | null; brief_id: string | null }, views: number) {
  const { data: c } = await a.from("creators").select("tier, per_post_override, rpm_override, cap_override, fixed_monthly_override").eq("id", post.creator_id).single();
  const { data: t } = await a.from("ugc_tiers").select("tier, per_post, cpm, cap_per_post, per_post_pov, per_post_reaction, per_post_talking_head").eq("app_id", post.app_id).eq("tier", c?.tier ?? "trial").maybeSingle();
  if (!t) return { amount: null, formula: "No pay settings for this creator's tier — set them in Payouts → Tiers" };
  let effort = post.effort as Effort | null;
  if (!effort && post.brief_id) { const { data: b } = await a.from("briefs").select("effort").eq("id", post.brief_id).maybeSingle(); effort = (b?.effort as Effort | null) ?? null; }
  const fixedDeal = c?.fixed_monthly_override != null;
  const per = fixedDeal ? 0 : Number(c?.per_post_override ?? ratePerEffort(t as TierTerms, effort ?? "talking_head"));
  const rpm = Number(c?.rpm_override ?? t.cpm);
  const cap = Number(c?.cap_override ?? t.cap_per_post);
  const igBaseOnly = post.platform === "instagram";
  const rawViews = igBaseOnly ? 0 : (views / 1000) * rpm;
  const viewsPart = round2(cap > 0 ? Math.min(rawViews, cap) : rawViews);
  const amount = round2(per + viewsPart);
  const head = fixedDeal ? "fixed monthly deal (paid in Generate month) + " : `${eur(per)} + `;
  const formula = igBaseOnly
    ? `${fixedDeal ? "fixed monthly deal" : eur(per)} · Instagram pays the per-post part only = ${eur(amount)}`
    : `${head}${eur(rpm).replace(" €", " €")}/1000 × ${k(views)} = ${eur(amount)}${cap > 0 ? ` · cap ${eur(cap)}${rawViews > cap ? " (applied)" : ""}` : ""}`;
  return { amount, formula };
}

/** One Apify run per platform for validated posts still in tracking: refreshes views on the post rows. */
export async function trackValidated(a: Admin, onlyIds?: string[]) {
  let q = a.from("creator_posts").select("id, url, platform").eq("status", "approved").eq("pay_status", "tracking");
  if (onlyIds) q = q.in("id", onlyIds);
  const { data: rows } = await q.limit(200);
  if (!rows?.length) return { tracked: 0, usd: 0 };
  const { apifyRun, INSPIRATION_ACTORS } = await import("./inspirations.server");
  let usd = 0; let tracked = 0;
  const tt = rows.filter((r: any) => r.platform === "tiktok"); const ig = rows.filter((r: any) => r.platform === "instagram");
  const num = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const idOf = (u: string) => u.match(/\/(?:video|photo)\/(\d+)/)?.[1] ?? u.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/)?.[1] ?? "";
  if (tt.length) {
    const r = await apifyRun(INSPIRATION_ACTORS.tiktok, { postURLs: tt.map((x: any) => x.url), shouldDownloadVideos: false, shouldDownloadCovers: false, resultsPerPage: 1 }); usd += r.usd;
    for (const p of tt) { const i = r.items.find((x: any) => x?.id && (String(x.id) === idOf(p.url) || x.webVideoUrl === p.url)); if (!i) continue; tracked++;
      await a.from("creator_posts").update({ views: num(i.playCount), likes: num(i.diggCount), comments: num(i.commentCount), shares: num(i.shareCount), cover_url: i.videoMeta?.coverUrl ?? null, caption: i.text ?? null }).eq("id", p.id); }
  }
  if (ig.length) {
    const r = await apifyRun(INSPIRATION_ACTORS.instagram, { directUrls: ig.map((x: any) => x.url), resultsType: "posts", resultsLimit: 1 }); usd += r.usd;
    for (const p of ig) { const i = r.items.find((x: any) => x?.shortCode && x.shortCode === idOf(p.url)); if (!i) continue; tracked++;
      await a.from("creator_posts").update({ views: num(i.videoPlayCount ?? i.videoViewCount), likes: num(i.likesCount), comments: num(i.commentsCount), cover_url: i.displayUrl ?? null, caption: i.caption ?? null }).eq("id", p.id); }
  }
  await a.from("sync_runs").insert({ job: "ugc-track-validated", status: "done", items: tracked, cost_usd: usd, started_at: new Date().toISOString(), finished_at: new Date().toISOString(), meta: { posts: rows.length } });
  return { tracked, usd };
}

/** Freezes views at J+7 after validation and prices the post. `force` (admin "simulate J+7") skips the 7-day wait. */
export async function freezeDue(a: Admin, opts: { postId?: string; force?: boolean } = {}) {
  let q = a.from("creator_posts").select("id, creator_id, app_id, platform, effort, brief_id, url, views, validated_at, external_id").eq("status", "approved").eq("pay_status", "tracking");
  if (opts.postId) q = q.eq("id", opts.postId);
  if (!opts.force) q = q.lte("validated_at", new Date(Date.now() - 7 * DAY).toISOString());
  const { data: rows } = await q.limit(500);
  let ready = 0, flagged = 0;
  for (const p of rows ?? []) {
    let views: number | null = p.views == null ? null : Number(p.views);
    if (views == null) {
      const { data: ext } = await a.from("external_posts").select("views, views_7d").or(`logged_post_id.eq.${p.id},url.eq.${p.url}`).limit(1).maybeSingle();
      views = ext ? Number(ext.views_7d ?? ext.views ?? NaN) : null; if (Number.isNaN(views)) views = null;
    }
    const now = new Date().toISOString();
    if (views == null) {
      await a.from("creator_posts").update({ pay_status: "no_data", pay_flag: "No view data at J+7 — check the link or enter views by hand", frozen_at: now }).eq("id", p.id); flagged++; continue;
    }
    const price = await priceFor(a, p, views);
    if (price.amount == null) { await a.from("creator_posts").update({ pay_status: "no_data", pay_flag: price.formula, views_frozen: views, frozen_at: now }).eq("id", p.id); flagged++; continue; }
    await a.from("creator_posts").update({ pay_status: "ready", views_frozen: views, frozen_at: now, pay_amount: price.amount, pay_formula: price.formula, pay_flag: null }).eq("id", p.id); ready++;
  }
  return { ready, flagged };
}

/** Approve a creator's Ready posts into a payable batch item (Pay via Stripe / exports reuse the batch tools). */
export async function approveReady(a: Admin, creatorId: string, by: string) {
  const { data: posts } = await a.from("creator_posts").select("id, pay_amount, pay_currency, url, pay_formula, app_id").eq("creator_id", creatorId).eq("pay_status", "ready");
  const total = round2((posts ?? []).reduce((s: number, p: any) => s + Number(p.pay_amount ?? 0), 0));
  const { data: s } = await a.from("ugc_settings").select("min_payout").eq("id", 1).maybeSingle();
  const min = Number(s?.min_payout ?? 20);
  if (!posts?.length) throw new Error("Nothing ready for this creator.");
  if (total < min) throw new Error(`Below the ${min} € minimum payout — it carries over until it reaches it.`);
  const day = new Date().toISOString().slice(0, 10);
  const { data: batch, error } = await a.from("payout_batches").insert({ period: `J+7 ${day} · ${creatorId.slice(0, 6)}-${Date.now().toString(36)}`, status: "approved", created_by: by }).select("id").single();
  if (error) throw new Error("The payout could not be created.");
  const { data: item, error: e2 } = await a.from("payout_items").insert({ batch_id: batch.id, creator_id: creatorId, posts_count: posts.length, amount: total, amount_usd: total, currency: "EUR", status: "pending", period: day, app_id: posts[0].app_id, breakdown: { kind: "j7", posts: posts.map((p: any) => ({ id: p.id, url: p.url, amount: p.pay_amount, formula: p.pay_formula })) } }).select("id").single();
  if (e2) throw new Error("The payout item could not be created.");
  await a.from("creator_posts").update({ pay_status: "approved", payout_item_id: item.id }).in("id", posts.map((p: any) => p.id));
  return { batchId: batch.id as string, total, posts: posts.length };
}
