// Server-only ad platform calls. Every object is created PAUSED; a person switches it on.
type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Result = { ok: true; ids: Record<string, string> } | { ok: false; reason: string };

const META = "https://graph.facebook.com/v21.0";
const TT = "https://business-api.tiktok.com/open_api/v1.3";

async function metaCall(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${META}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, access_token: token }) });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) throw new Error(`Meta ${res.status}: ${json.error?.message ?? "request failed"}`);
  return json;
}
async function ttCall(path: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(`${TT}/${path}`, { method: "POST", headers: { "content-type": "application/json", "Access-Token": token }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.code !== 0) throw new Error(`TikTok ${res.status}: ${json.message ?? "request failed"}`);
  return json.data;
}

/** config: { page_id, app_id (Meta app), store_url } saved in Connections. */
export async function pushMetaAd(a: Admin, ad: any, conn: { account_id?: string | null; config?: any } | null): Promise<Result> {
  const token = process.env["META_ADS_TOKEN"];
  if (!token) return { ok: false, reason: "Meta is not connected: add the META_ADS_TOKEN secret first." };
  if (!conn?.account_id || !conn.config?.page_id) return { ok: false, reason: "Save the Meta ad account id and Facebook page id in Connections first." };
  if (!ad.raw_file_path) return { ok: false, reason: "Meta needs the original video file. Request it from the creator or upload it." };
  if (!ad.daily_budget) return { ok: false, reason: "Set a daily budget first." };
  try {
    const acct = conn.account_id.startsWith("act_") ? conn.account_id : `act_${conn.account_id}`;
    const { data: signed } = await a.storage.from("creator-videos").createSignedUrl(ad.raw_file_path, 3600);
    const video = await metaCall(`${acct}/advideos`, { file_url: signed?.signedUrl, name: `ad-${ad.id}` }, token);
    const campaign = await metaCall(`${acct}/campaigns`, { name: `Hub ${ad.id.slice(0, 8)}`, objective: "OUTCOME_APP_PROMOTION", status: "PAUSED", special_ad_categories: [] }, token);
    const adset = await metaCall(`${acct}/adsets`, {
      name: `Hub ${ad.id.slice(0, 8)} ${ad.country}`, campaign_id: campaign.id, status: "PAUSED",
      daily_budget: Math.round(Number(ad.daily_budget) * 100), billing_event: "IMPRESSIONS", optimization_goal: "APP_INSTALLS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP", targeting: { geo_locations: { countries: [ad.country] } },
      promoted_object: { application_id: conn.config.app_id, object_store_url: conn.config.store_url },
      ...(ad.duration_days ? { end_time: new Date(Date.now() + ad.duration_days * 86400_000).toISOString() } : {}),
    }, token);
    const creative = await metaCall(`${acct}/adcreatives`, {
      name: `Hub ${ad.id.slice(0, 8)}`,
      object_story_spec: { page_id: conn.config.page_id, video_data: { video_id: video.id, message: ad.caption ?? "", title: ad.hook ?? "", call_to_action: { type: "INSTALL_MOBILE_APP", value: { link: ad.landing_url } } } },
    }, token);
    const adRow = await metaCall(`${acct}/ads`, { name: `Hub ${ad.id.slice(0, 8)}`, adset_id: adset.id, creative: { creative_id: creative.id }, status: "PAUSED" }, token);
    return { ok: true, ids: { channel: "meta", campaign_id: campaign.id, adset_id: adset.id, ad_id: adRow.id, video_id: video.id } };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** config: { app_id (TikTok app id) } saved in Connections. Uses the Spark authorization code. */
export async function pushTikTokAd(ad: any, conn: { account_id?: string | null; config?: any } | null): Promise<Result> {
  const token = process.env["TIKTOK_ADS_TOKEN"];
  if (!token) return { ok: false, reason: "TikTok is not connected: add the TIKTOK_ADS_TOKEN secret first." };
  if (!conn?.account_id) return { ok: false, reason: "Save the TikTok advertiser id in Connections first." };
  if (!ad.spark_code) return { ok: false, reason: "TikTok Spark Ads need the authorization code from the posting account." };
  if (!ad.daily_budget) return { ok: false, reason: "Set a daily budget first." };
  try {
    const advertiser_id = conn.account_id;
    await ttCall("tt_video/authorize/", { advertiser_id, auth_code: ad.spark_code }, token);
    const info = await ttCall("tt_video/info/", { advertiser_id, auth_code: ad.spark_code }, token);
    const itemId = info?.item_info?.item_id; const identityId = info?.user_info?.identity_id;
    const campaign = await ttCall("campaign/create/", { advertiser_id, campaign_name: `Hub ${ad.id.slice(0, 8)}`, objective_type: "APP_PROMOTION", app_promotion_type: "APP_INSTALL", budget_mode: "BUDGET_MODE_INFINITE", operation_status: "DISABLE" }, token);
    const group = await ttCall("adgroup/create/", {
      advertiser_id, campaign_id: campaign.campaign_id, adgroup_name: `Hub ${ad.id.slice(0, 8)} ${ad.country}`, operation_status: "DISABLE",
      placement_type: "PLACEMENT_TYPE_NORMAL", placements: ["PLACEMENT_TIKTOK"], location_ids: conn.config?.location_ids ?? [], app_id: conn.config?.app_id,
      budget_mode: "BUDGET_MODE_DAY", budget: Number(ad.daily_budget), schedule_type: ad.duration_days ? "SCHEDULE_START_END" : "SCHEDULE_FROM_NOW",
      schedule_start_time: new Date().toISOString().slice(0, 19).replace("T", " "),
      ...(ad.duration_days ? { schedule_end_time: new Date(Date.now() + ad.duration_days * 86400_000).toISOString().slice(0, 19).replace("T", " ") } : {}),
      optimization_goal: "INSTALL", billing_event: "OCPM", bid_type: "BID_TYPE_NO_BID",
    }, token);
    const created = await ttCall("ad/create/", {
      advertiser_id, adgroup_id: group.adgroup_id,
      creatives: [{ ad_name: `Hub ${ad.id.slice(0, 8)}`, identity_type: "AUTH_CODE", identity_id: identityId, tiktok_item_id: itemId, call_to_action: "DOWNLOAD_NOW", landing_page_url: ad.landing_url, ad_format: "SINGLE_VIDEO", operation_status: "DISABLE" }],
    }, token);
    return { ok: true, ids: { channel: "tiktok", advertiser_id, campaign_id: campaign.campaign_id, adgroup_id: group.adgroup_id, ad_id: String(created?.ad_ids?.[0] ?? "") } };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export async function setRemoteStatus(ad: any, status: "ACTIVE" | "PAUSED"): Promise<string | null> {
  try {
    if (ad.channel === "meta") {
      const token = process.env["META_ADS_TOKEN"]; if (!token) return "Meta not connected — change it in Ads Manager";
      await metaCall(ad.external_ids.ad_id, { status }, token);
      await metaCall(ad.external_ids.adset_id, { status }, token);
      await metaCall(ad.external_ids.campaign_id, { status }, token);
    } else {
      const token = process.env["TIKTOK_ADS_TOKEN"]; if (!token) return "TikTok not connected — change it in Ads Manager";
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
  const { data: ads } = await a.from("ad_candidates").select("id, channel, external_ids").in("status", ["live", "paused", "pushed"]);
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
        const token = process.env["TIKTOK_ADS_TOKEN"]; if (!token) continue;
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
