// Server-only Apify sync for UGC compliance (weekly) and D+7 views (daily).
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

type Found = {
  platform: "tiktok" | "instagram";
  external_id: string;
  url: string | null;
  posted_at: string | null;
  caption: string | null;
  cover_url: string | null;
  duration: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

const clean = (h: string | null | undefined) => (h ?? "").trim().replace(/^@/, "").replace(/^https?:\/\/[^/]+\/@?/, "").replace(/\/.*$/, "");
const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

async function runActor(actor: string, input: unknown): Promise<any[]> {
  const token = process.env["APIFY_TOKEN"];
  if (!token) throw new Error("APIFY_TOKEN missing");
  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=240`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify ${actor} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function scrapeTikTok(actor: string, handle: string, perProfile: number): Promise<Found[]> {
  const items = await runActor(actor, { profiles: [handle], resultsPerPage: perProfile, shouldDownloadVideos: false, shouldDownloadCovers: false });
  return items
    .filter((i) => i && i.id && !i.error)
    .map((i) => ({
      platform: "tiktok" as const,
      external_id: String(i.id),
      url: i.webVideoUrl ?? null,
      posted_at: i.createTimeISO ?? (i.createTime ? new Date(Number(i.createTime) * 1000).toISOString() : null),
      caption: i.text ?? null,
      cover_url: i.videoMeta?.coverUrl ?? null,
      duration: num(i.videoMeta?.duration),
      views: num(i.playCount), likes: num(i.diggCount), comments: num(i.commentCount), shares: num(i.shareCount),
    }));
}

async function scrapeInstagram(actor: string, handle: string): Promise<Found[]> {
  const items = await runActor(actor, { usernames: [handle], resultsLimit: 30 });
  const posts = items.flatMap((p) => (Array.isArray(p?.latestPosts) ? p.latestPosts : p?.shortCode ? [p] : []));
  return posts
    .filter((i: any) => i && (i.id || i.shortCode))
    .map((i: any) => ({
      platform: "instagram" as const,
      external_id: String(i.id ?? i.shortCode),
      url: i.url ?? (i.shortCode ? `https://www.instagram.com/p/${i.shortCode}/` : null),
      posted_at: i.timestamp ?? null,
      caption: i.caption ?? null,
      cover_url: i.displayUrl ?? null,
      duration: num(i.videoDuration),
      views: num(i.videoPlayCount ?? i.videoViewCount), likes: num(i.likesCount), comments: num(i.commentsCount), shares: null,
    }));
}

const normUrl = (u: string | null | undefined) => (u ?? "").toLowerCase().replace(/[?#].*$/, "").replace(/\/$/, "");

async function upsertFound(admin: Admin, creatorId: string, found: Found[]) {
  if (!found.length) return;
  const now = new Date().toISOString();
  const { data: logged } = await admin.from("creator_posts").select("id, url, brief_id").eq("creator_id", creatorId);
  const rows = found.map((f) => {
    const match = (logged ?? []).find((l: any) => normUrl(l.url) === normUrl(f.url) || (f.external_id && String(l.url ?? "").includes(f.external_id)));
    return { ...f, creator_id: creatorId, last_synced_at: now, logged_post_id: match?.id ?? null, brief_id: match?.brief_id ?? null };
  });
  // keep first_seen_at / D+7 fields untouched on conflict
  const { error } = await admin.from("external_posts").upsert(rows, { onConflict: "platform,external_id", ignoreDuplicates: false });
  if (error) throw new Error(`store: ${error.message}`);
}

async function settings(admin: Admin) {
  const { data } = await admin.from("ugc_settings").select("*").eq("id", 1).maybeSingle();
  return data ?? { apify_tiktok_actor: "clockworks~tiktok-profile-scraper", apify_instagram_actor: "apify~instagram-profile-scraper", apify_price_per_result_usd: 0.0003, posts_per_profile_call: 30 };
}

async function syncCreator(admin: Admin, c: any, s: any) {
  let items = 0;
  const errors: string[] = [];
  const wantsTt = c.required_platforms !== "instagram";
  const wantsIg = c.required_platforms !== "tiktok";
  if (wantsTt && c.tiktok_handle) {
    try { const f = await scrapeTikTok(s.apify_tiktok_actor, clean(c.tiktok_handle), s.posts_per_profile_call); items += f.length; await upsertFound(admin, c.id, f); }
    catch (e) { errors.push(`TikTok: ${(e as Error).message}`); }
  }
  if (wantsIg && c.instagram_handle) {
    try { const f = await scrapeInstagram(s.apify_instagram_actor, clean(c.instagram_handle)); items += f.length; await upsertFound(admin, c.id, f); }
    catch (e) { errors.push(`Instagram: ${(e as Error).message}`); }
  }
  if (!c.tiktok_handle && !c.instagram_handle) errors.push("No handle registered");
  await admin.from("creators").update({
    sync_status: errors.length ? "failed" : "ok",
    sync_error: errors.join(" · ") || null,
    sync_checked_at: new Date().toISOString(),
  }).eq("id", c.id);
  return { items, errors };
}

export async function runComplianceSync(admin: Admin, creatorId?: string) {
  const s = await settings(admin);
  const { data: run } = await admin.from("sync_runs").insert({ job: "compliance", creator_id: creatorId ?? null }).select("id").single();
  let q = admin.from("creators").select("id, tiktok_handle, instagram_handle, required_platforms").eq("track", "ugc");
  q = creatorId ? q.eq("id", creatorId) : q.in("ugc_status", ["trial", "active"]);
  const { data: creators } = await q;
  let items = 0;
  const errs: string[] = [];
  for (const c of creators ?? []) {
    const r = await syncCreator(admin, c, s);
    items += r.items;
    if (r.errors.length) errs.push(`${c.id.slice(0, 8)}: ${r.errors.join("; ")}`);
  }
  const cost = items * Number(s.apify_price_per_result_usd);
  await admin.from("sync_runs").update({ status: errs.length ? (items ? "partial" : "failed") : "ok", items, cost_usd: cost, error: errs.join("\n").slice(0, 2000) || null, finished_at: new Date().toISOString() }).eq("id", run.id);
  return { items, cost, errors: errs };
}

/** Daily: fix views_7d for posts 7–8 days old (and 30-day snapshot) by re-scraping their creators. */
export async function runD7Sync(admin: Admin) {
  const s = await settings(admin);
  const { data: run } = await admin.from("sync_runs").insert({ job: "d7" }).select("id").single();
  const day = 86400000;
  const now = Date.now();
  const { data: due7 } = await admin.from("external_posts").select("id, creator_id")
    .is("views_7d", null).lte("posted_at", new Date(now - 7 * day).toISOString()).gte("posted_at", new Date(now - 8 * day).toISOString());
  const { data: due30 } = await admin.from("external_posts").select("id, creator_id")
    .is("views_30d", null).lte("posted_at", new Date(now - 30 * day).toISOString()).gte("posted_at", new Date(now - 31 * day).toISOString());
  const creatorIds = [...new Set([...(due7 ?? []), ...(due30 ?? [])].map((p: any) => p.creator_id))];
  let items = 0;
  const errs: string[] = [];
  if (creatorIds.length) {
    const { data: creators } = await admin.from("creators").select("id, tiktok_handle, instagram_handle, required_platforms").in("id", creatorIds);
    for (const c of creators ?? []) {
      const r = await syncCreator(admin, c, s);
      items += r.items;
      if (r.errors.length) errs.push(`${c.id.slice(0, 8)}: ${r.errors.join("; ")}`);
    }
  }
  const stamp = new Date().toISOString();
  for (const p of due7 ?? []) {
    const { data: row } = await admin.from("external_posts").select("views, likes, comments, shares, last_synced_at").eq("id", p.id).maybeSingle();
    if (row && row.views != null && row.last_synced_at >= new Date(now - 3600000).toISOString()) {
      await admin.from("external_posts").update({ views_7d: row.views, likes_7d: row.likes, comments_7d: row.comments, shares_7d: row.shares, views_7d_at: stamp, views_7d_source: "sync" }).eq("id", p.id);
    }
  }
  for (const p of due30 ?? []) {
    const { data: row } = await admin.from("external_posts").select("views").eq("id", p.id).maybeSingle();
    if (row?.views != null) await admin.from("external_posts").update({ views_30d: row.views, views_30d_at: stamp }).eq("id", p.id);
  }
  const cost = items * Number(s.apify_price_per_result_usd);
  await admin.from("sync_runs").update({ status: errs.length ? "partial" : "ok", items, cost_usd: cost, error: errs.join("\n").slice(0, 2000) || null, finished_at: stamp }).eq("id", run.id);
  return { items, cost, updated7: (due7 ?? []).length, errors: errs };
}
