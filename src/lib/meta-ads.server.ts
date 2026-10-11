/* Meta Ads Library reading through Apify (one run per link, logged in sync_runs). */
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Swap the actors here. */
export const META_ADS_ACTORS = {
  primary: "apify~facebook-ads-scraper",
  fallback: "jmlp~meta-ad-library-scraper",
};

export const isMetaAdsUrl = (u: string) => /(^|\.)facebook\.com\/ads\/library/i.test(u);
const singleAdId = (u: string) => { try { const x = new URL(u); const id = x.searchParams.get("id"); return id && /^\d+$/.test(id) && !x.searchParams.get("view_all_page_id") && !x.searchParams.get("q") ? id : null; } catch { return null; } };

export type MetaAd = {
  adId: string; pageName: string; body: string; title: string; linkUrl: string | null;
  videoUrl: string | null; previewImage: string | null; images: string[];
  startDate: string | null; endDate: string | null; platforms: string[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const asDate = (v: any) => { if (v == null || v === "") return null; const d = typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(String(v)); return isNaN(+d) ? null : d.toISOString().slice(0, 10); };
function normalise(it: any): MetaAd | null {
  const s = it.snapshot ?? it;
  const cards: any[] = s.cards ?? [];
  const vids: any[] = [...(s.videos ?? []), ...cards.flatMap((c) => c.videos ?? (c.video_hd_url || c.video_sd_url ? [c] : []))];
  const v = vids.find((x) => x.video_hd_url || x.video_sd_url || x.videoHdUrl || x.videoSdUrl);
  const imgs: string[] = [...(s.images ?? []), ...cards.flatMap((c) => c.images ?? (c.original_image_url || c.resized_image_url ? [c] : []))]
    .map((i: any) => (typeof i === "string" ? i : i.original_image_url ?? i.resized_image_url ?? i.url)).filter(Boolean);
  const body = typeof s.body === "string" ? s.body : s.body?.text ?? cards.map((c) => c.body).filter(Boolean).join("\n") ?? it.ad_text ?? "";
  const adId = String(it.ad_archive_id ?? it.adArchiveId ?? it.ad_id ?? it.id ?? "");
  if (!adId && !v && !imgs.length && !body) return null;
  const plats = it.publisher_platform ?? it.publisherPlatform ?? it.platforms ?? [];
  return {
    adId, pageName: String(it.page_name ?? s.page_name ?? it.pageName ?? ""), body: String(body || it.ad_text || ""),
    title: String(s.title ?? cards[0]?.title ?? ""), linkUrl: s.link_url ?? cards[0]?.link_url ?? it.link_url ?? null,
    videoUrl: v ? (v.video_hd_url ?? v.videoHdUrl ?? v.video_sd_url ?? v.videoSdUrl) : null,
    previewImage: v ? (v.video_preview_image_url ?? v.videoPreviewImageUrl ?? null) : null, images: imgs.slice(0, 5),
    startDate: asDate(it.start_date ?? it.startDate), endDate: asDate(it.end_date ?? it.endDate),
    platforms: (Array.isArray(plats) ? plats : [plats]).map((p: string) => String(p).toLowerCase()).filter(Boolean),
  };
}

async function runActor(actor: string, input: object): Promise<{ items: any[]; runId: string | null }> {
  const token = process.env["APIFY_TOKEN"];
  if (!token) throw new Error("Apify is not configured (APIFY_TOKEN).");
  const res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=240`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  let runId = res.headers.get("x-apify-run-id");
  if (!runId) { try { const l = await fetch(`https://api.apify.com/v2/acts/${actor}/runs/last`, { headers: { Authorization: `Bearer ${token}` } }); runId = ((await l.json()) as { data?: { id?: string } }).data?.id ?? null; } catch { /* id is only for the log */ } }
  if (!res.ok) throw new Error(`Apify ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json();
  return { items: Array.isArray(j) ? j : [], runId };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchMetaAds(a: Admin, url: string, limit?: number): Promise<MetaAd[]> {
  const single = singleAdId(url);
  const n = single ? 1 : Math.min(5, limit ?? 5);
  const t0 = Date.now();
  const { data: run } = await a.from("sync_runs").insert({ job: "meta_ads_library", meta: { url } }).select("id").single();
  const log: { actor: string; run_id: string | null; ms: number; items: number }[] = [];
  let ads: MetaAd[] = []; let err: string | null = null;
  try {
    let t = Date.now();
    const r = await runActor(META_ADS_ACTORS.primary, { startUrls: [{ url }], resultsLimit: n });
    log.push({ actor: META_ADS_ACTORS.primary, run_id: r.runId, ms: Date.now() - t, items: r.items.length });
    ads = r.items.map(normalise).filter((x): x is MetaAd => !!x && (!single || !x.adId || x.adId === single));
    if (!ads.length && single) {
      t = Date.now();
      const f = await runActor(META_ADS_ACTORS.fallback, { adLibraryUrl: url, maxAds: 1 });
      log.push({ actor: META_ADS_ACTORS.fallback, run_id: f.runId, ms: Date.now() - t, items: f.items.length });
      ads = f.items.map(normalise).filter((x): x is MetaAd => !!x);
    }
  } catch (e) { err = (e as Error).message; }
  if (run?.id) await a.from("sync_runs").update({ status: err ? "error" : "ok", items: ads.length, error: err, finished_at: new Date().toISOString(), meta: { url, ms: Date.now() - t0, runs: log } }).eq("id", run.id);
  if (err) throw new Error(err.startsWith("Apify is not") ? err : "The Ads Library could not be read right now. Try again in a minute.");
  if (!ads.length) throw new Error("Ad not found in the Ads Library — check the link or upload the file.");
  return ads.slice(0, n);
}

/** Downloads the ad video into the same storage path pattern as manual uploads; returns path + a 1-hour signed link. */
export async function storeAdVideo(a: Admin, appId: string, videoUrl: string) {
  const r = await fetch(videoUrl, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error("The ad video could not be downloaded.");
  const buf = await r.arrayBuffer();
  if (buf.byteLength > 200 * 1024 * 1024) throw new Error("The ad video is over 200 MB.");
  const path = `${appId}/${crypto.randomUUID()}.mp4`;
  const { error } = await a.storage.from("creator-assets").upload(path, buf, { contentType: "video/mp4" });
  if (error) throw new Error("The ad video could not be saved.");
  const { data: s } = await a.storage.from("creator-assets").createSignedUrl(path, 3600);
  return { path, signedUrl: s?.signedUrl as string };
}
