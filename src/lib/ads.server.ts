// Server-only ad platform calls. Every object is created PAUSED; a person switches it on.
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Result = { ok: true; ids: Record<string, string> } | { ok: false; reason: string };

const META = "https://graph.facebook.com/v21.0";
const TT = "https://business-api.tiktok.com/open_api/v1.3";

async function metaCall(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${META}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, access_token: token }) });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) throw new Error(`Meta ${res.status}: ${[json.error?.message, json.error?.error_user_title, json.error?.error_user_msg].filter(Boolean).join(" — ") || "request failed"}`);
  return json;
}
async function ttCall(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${TT}/${path}`, { method: "POST", headers: { "content-type": "application/json", "Access-Token": token }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.code !== 0) throw new Error(`TikTok ${res.status}: ${json.message ?? "request failed"}`);
  return json.data;
}

/** Campaign + ad set, both PAUSED. OUTCOME_TRAFFIC, iOS, link clicks, website destination (no Meta SDK in the app yet). */
export async function createMetaCampaignAdset(token: string, accountId: string, o: { name: string; country: string; dailyBudget: number; durationDays?: number | null; beneficiary?: string; payor?: string }) {
  const acct = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const campaign = await metaCall(`${acct}/campaigns`, { name: o.name, objective: "OUTCOME_TRAFFIC", status: "PAUSED", special_ad_categories: [], is_adset_budget_sharing_enabled: false }, token);
  const adset = await metaCall(`${acct}/adsets`, {
    name: `${o.name} · ${o.country} iOS`, campaign_id: campaign.id, status: "PAUSED",
    daily_budget: Math.round(o.dailyBudget * 100), billing_event: "IMPRESSIONS", optimization_goal: "LINK_CLICKS", destination_type: "WEBSITE",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    // EU (DSA) requires who the ad promotes and who pays for it.
    dsa_beneficiary: o.beneficiary || "Sophia", dsa_payor: o.payor || "Vik Studios",
    targeting: { geo_locations: { countries: [o.country] }, device_platforms: ["mobile"], user_os: ["iOS"], publisher_platforms: ["facebook", "instagram"], targeting_automation: { advantage_audience: 0 } },
    ...(o.durationDays ? { end_time: new Date(Date.now() + o.durationDays * 86400_000).toISOString() } : {}),
  }, token);
  return { acct, campaign_id: campaign.id as string, adset_id: adset.id as string };
}

/** config: { page_id, instagram_actor_id, business_id } saved in Connections. Path: campaign → ad set → video → creative → ad, all PAUSED. */
export async function pushMetaAd(a: Admin, ad: any, conn: { account_id?: string | null; config?: any } | null): Promise<Result> {
  const token = process.env["META_ADS_TOKEN"];
  if (!token) return { ok: false, reason: "Meta is not connected: add the META_ADS_TOKEN secret first." };
  if (!conn?.account_id || !conn.config?.page_id) return { ok: false, reason: "Save the Meta ad account id and Facebook page id in Connections first." };
  if (!ad.raw_file_path) return { ok: false, reason: "Meta needs the original video file. Request it from the creator or upload it." };
  if (!ad.daily_budget) return { ok: false, reason: "Set a daily budget first." };
  try {
    const { data: app } = await a.from("apps").select("app_store_url").eq("id", ad.app_id).maybeSingle();
    const { data: cr } = ad.creator_id ? await a.from("creators").select("tiktok_handle, instagram_handle").eq("id", ad.creator_id).maybeSingle() : { data: null };
    const handle = String(cr?.tiktok_handle ?? cr?.instagram_handle ?? "hub").replace(/^@/, "");
    const link = ad.landing_url || `https://sophia-culture.com/go/${encodeURIComponent(handle)}`;
    const { acct, campaign_id, adset_id } = await createMetaCampaignAdset(token, conn.account_id, { name: `Sophia Hub – ${ad.id.slice(0, 8)}`, country: ad.country ?? "FR", dailyBudget: Number(ad.daily_budget), durationDays: ad.duration_days, beneficiary: conn.config.dsa_beneficiary, payor: conn.config.dsa_payor });
    const { data: signed } = await a.storage.from("creator-videos").createSignedUrl(ad.raw_file_path, 3600);
    const video = await metaCall(`${acct}/advideos`, { file_url: signed?.signedUrl, name: `ad-${ad.id}` }, token);
    const story: Record<string, unknown> = { page_id: conn.config.page_id, video_data: { video_id: video.id, message: ad.caption ?? "", title: ad.hook ?? "", call_to_action: { type: "DOWNLOAD", value: { link } } } };
    if (conn.config.instagram_actor_id) story["instagram_user_id"] = conn.config.instagram_actor_id;
    const creative = await metaCall(`${acct}/adcreatives`, { name: `Hub ${ad.id.slice(0, 8)}`, object_story_spec: story }, token);
    const adRow = await metaCall(`${acct}/ads`, { name: `Hub ${ad.id.slice(0, 8)}`, adset_id, creative: { creative_id: creative.id }, status: "PAUSED" }, token);
    void app;
    return { ok: true, ids: { channel: "meta", campaign_id, adset_id, ad_id: adRow.id, video_id: video.id } };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** Live checks for the Connections card; never returns the token. */
export async function verifyMeta(conn: { account_id?: string | null; config?: any } | null) {
  const token = process.env["META_ADS_TOKEN"];
  if (!token) return [{ check: "Token", ok: false, detail: "META_ADS_TOKEN not set" }];
  const get = async (p: string) => { const r = await fetch(`${META}/${p}`, { headers: { Authorization: `Bearer ${token}` } }); const j = (await r.json().catch(() => ({}))) as any; return r.ok && !j.error ? { ok: true, j } : { ok: false, j }; };
  const out: { check: string; ok: boolean; detail: string }[] = [];
  const me = await get("me"); out.push({ check: "Token (/me)", ok: me.ok, detail: me.ok ? me.j.name : me.j.error?.message ?? "error" });
  const acct = conn?.account_id ? (conn.account_id.startsWith("act_") ? conn.account_id : `act_${conn.account_id}`) : null;
  if (acct) { const r = await get(`${acct}?fields=name,account_status,currency`); out.push({ check: "Ad account", ok: r.ok && r.j.account_status === 1, detail: r.ok ? `${r.j.name} · status ${r.j.account_status} · ${r.j.currency}` : r.j.error?.message ?? "error" }); }
  if (conn?.config?.page_id) { const r = await get(`${conn.config.page_id}?fields=name,instagram_business_account`); out.push({ check: "Page", ok: r.ok, detail: r.ok ? r.j.name : r.j.error?.message ?? "error" }); out.push({ check: "Instagram account", ok: Boolean(conn.config.instagram_actor_id || r.j?.instagram_business_account?.id), detail: conn.config.instagram_actor_id || r.j?.instagram_business_account?.id || "No Instagram account linked to this page for the system user" }); }
  return out;
}

export const TIKTOK_REDIRECT_URI = "https://sophia-culture.com/api/public/tiktok/oauth";

/** OAuth token saved by /api/public/tiktok/oauth; server-only table, never sent to the browser. */
export async function tiktokToken(a: Admin, appId?: string | null): Promise<string | null> {
  let q = a.from("ad_tokens").select("access_token").eq("channel", "tiktok");
  if (appId) q = q.eq("app_id", appId);
  const { data } = await q.limit(1).maybeSingle();
  return data?.access_token ?? process.env["TIKTOK_ADS_TOKEN"] ?? null;
}

async function ttGet(path: string, q: Record<string, unknown>, token: string) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(q).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])));
  const res = await fetch(`${TT}/${path}?${qs}`, { headers: { "Access-Token": token } });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.code !== 0) throw new Error(`TikTok ${res.status}: ${json.message ?? "request failed"}`);
  return json.data;
}

/** Campaign (TRAFFIC) → ad group PAUSED (FR, iOS, daily budget) → Spark identity from the auth code → ad PAUSED. */
export async function pushTikTokAd(a: Admin, ad: any, conn: { account_id?: string | null; config?: any } | null): Promise<Result> {
  const token = await tiktokToken(a, ad.app_id);
  if (!token) return { ok: false, reason: "TikTok is not connected: use Connect TikTok in Connections first." };
  if (!conn?.account_id) return { ok: false, reason: "Save the TikTok advertiser id in Connections first." };
  if (!ad.spark_code) return { ok: false, reason: "TikTok Spark Ads need the authorization code from the posting account." };
  if (!ad.daily_budget) return { ok: false, reason: "Set a daily budget first." };
  try {
    const advertiser_id = conn.account_id;
    const { data: cr } = ad.creator_id ? await a.from("creators").select("tiktok_handle").eq("id", ad.creator_id).maybeSingle() : { data: null };
    const link = ad.landing_url || `https://sophia-culture.com/go/${encodeURIComponent(String(cr?.tiktok_handle ?? "hub").replace(/^@/, ""))}`;
    await ttCall("tt_video/authorize/", { advertiser_id, auth_code: ad.spark_code }, token);
    const ids = await ttGet("identity/get/", { advertiser_id, identity_type: "AUTH_CODE" }, token);
    const identity = (ids?.identity_list ?? [])[0];
    const info = await ttGet("tt_video/info/", { advertiser_id, auth_code: ad.spark_code }, token);
    const itemId = info?.item_info?.item_id;
    const identityId = identity?.identity_id ?? info?.user_info?.identity_id;
    const name = `Sophia Hub – ${ad.id.slice(0, 8)}`;
    const campaign = await ttCall("campaign/create/", { advertiser_id, campaign_name: name, objective_type: "TRAFFIC", budget_mode: "BUDGET_MODE_INFINITE", operation_status: "DISABLE" }, token);
    const group = await ttCall("adgroup/create/", {
      advertiser_id, campaign_id: campaign.campaign_id, adgroup_name: `${name} · ${ad.country ?? "FR"} iOS`, operation_status: "DISABLE",
      promotion_type: "WEBSITE", placement_type: "PLACEMENT_TYPE_NORMAL", placements: ["PLACEMENT_TIKTOK"],
      location_ids: conn.config?.location_ids ?? ["3017382"], operating_systems: ["IOS"],
      budget_mode: "BUDGET_MODE_DAY", budget: Number(ad.daily_budget), schedule_type: ad.duration_days ? "SCHEDULE_START_END" : "SCHEDULE_FROM_NOW",
      schedule_start_time: new Date().toISOString().slice(0, 19).replace("T", " "),
      ...(ad.duration_days ? { schedule_end_time: new Date(Date.now() + ad.duration_days * 86400_000).toISOString().slice(0, 19).replace("T", " ") } : {}),
      optimization_goal: "CLICK", billing_event: "CPC", bid_type: "BID_TYPE_NO_BID",
    }, token);
    const created = await ttCall("ad/create/", {
      advertiser_id, adgroup_id: group.adgroup_id,
      creatives: [{ ad_name: name, identity_type: "AUTH_CODE", identity_id: identityId, tiktok_item_id: itemId, call_to_action: "DOWNLOAD_NOW", landing_page_url: link, ad_format: "SINGLE_VIDEO", operation_status: "DISABLE" }],
    }, token);
    return { ok: true, ids: { channel: "tiktok", advertiser_id, campaign_id: campaign.campaign_id, adgroup_id: group.adgroup_id, ad_id: String(created?.ad_ids?.[0] ?? "") } };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export async function verifyTikTok(a: Admin, advertiserId: string | null, appId: string) {
  const token = await tiktokToken(a, appId);
  if (!token) return [{ check: "TikTok token", ok: false, detail: "Not connected" }];
  if (!advertiserId) return [{ check: "Advertiser", ok: false, detail: "No advertiser id saved" }];
  try {
    const d = await ttGet("advertiser/info/", { advertiser_ids: [advertiserId], fields: ["name", "status", "currency"] }, token);
    const x = d?.list?.[0];
    return [{ check: "Advertiser", ok: x?.status === "STATUS_ENABLE", detail: x ? `${x.name} · ${x.status} · ${x.currency ?? ""}` : "Not found" }];
  } catch (e) { return [{ check: "Token / advertiser", ok: false, detail: (e as Error).message }]; }
}

export async function setRemoteStatus(ad: any, status: "ACTIVE" | "PAUSED"): Promise<string | null> {
  try {
    if (ad.channel === "meta") {
      const token = process.env["META_ADS_TOKEN"]; if (!token) return "Meta not connected — change it in Ads Manager";
      await metaCall(ad.external_ids.ad_id, { status }, token);
      await metaCall(ad.external_ids.adset_id, { status }, token);
      await metaCall(ad.external_ids.campaign_id, { status }, token);
    } else {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const token = await tiktokToken(supabaseAdmin, ad.app_id); if (!token) return "TikTok not connected — change it in Ads Manager";
      const op = status === "ACTIVE" ? "ENABLE" : "DISABLE";
      const advertiser_id = ad.external_ids.advertiser_id;
      await ttCall("campaign/status/update/", { advertiser_id, campaign_ids: [ad.external_ids.campaign_id], operation_status: op }, token);
      await ttCall("adgroup/status/update/", { advertiser_id, adgroup_ids: [ad.external_ids.adgroup_id], operation_status: op }, token);
      await ttCall("ad/status/update/", { advertiser_id, ad_ids: [ad.external_ids.ad_id], operation_status: op }, token);
    }
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

/** Pulls yesterday's spend / impressions / clicks / installs for pushed ads. Manual entries are kept. */
export async function syncAdMetrics(a: Admin) {
  const { data: ads } = await a.from("ad_candidates").select("id, app_id, channel, external_ids").in("status", ["live", "paused", "pushed"]);
  const day = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  let synced = 0; const errors: string[] = [];
  for (const ad of ads ?? []) {
    if (!ad.external_ids?.ad_id) continue;
    try {
      if (ad.channel === "meta") {
        const token = process.env["META_ADS_TOKEN"]; if (!token) continue;
        const res = await fetch(`${META}/${ad.external_ids.ad_id}/insights?fields=spend,impressions,clicks,actions&time_range=${encodeURIComponent(JSON.stringify({ since: day, until: day }))}&access_token=${token}`);
        const j = (await res.json()) as any; const r = j.data?.[0];
        if (!r) continue;
        const installs = Number(r.actions?.find((x: any) => x.action_type === "mobile_app_install")?.value ?? 0);
        await a.from("ad_metrics_daily").upsert({ ad_id: ad.id, day, spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), clicks: Number(r.clicks ?? 0), installs, source: "meta" }, { onConflict: "ad_id,day" });
      } else {
        const token = await tiktokToken(a, ad.app_id); if (!token) continue;
        const q = new URLSearchParams({ advertiser_id: ad.external_ids.advertiser_id, report_type: "BASIC", data_level: "AUCTION_AD", dimensions: JSON.stringify(["ad_id", "stat_time_day"]), metrics: JSON.stringify(["spend", "impressions", "clicks", "app_install"]), start_date: day, end_date: day, filtering: JSON.stringify([{ field_name: "ad_ids", filter_type: "IN", filter_value: JSON.stringify([ad.external_ids.ad_id]) }]) });
        const res = await fetch(`${TT}/report/integrated/get/?${q}`, { headers: { "Access-Token": token } });
        const j = (await res.json()) as any; const m = j.data?.list?.[0]?.metrics;
        if (!m) continue;
        await a.from("ad_metrics_daily").upsert({ ad_id: ad.id, day, spend: Number(m.spend ?? 0), impressions: Number(m.impressions ?? 0), clicks: Number(m.clicks ?? 0), installs: Number(m.app_install ?? 0), source: "tiktok" }, { onConflict: "ad_id,day" });
      }
      synced++;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  return { synced, errors };
}
