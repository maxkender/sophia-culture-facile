/** Client-safe rules shared by the admin, the influencer space and the server. */

export const RIGHTS = ["post_only", "post_plus_ads_30", "post_plus_ads_90", "post_plus_raw_180"] as const;
export type Rights = (typeof RIGHTS)[number];

export const RIGHTS_LABEL: Record<Rights, { short: string; plain: string; days: number; ads: boolean }> = {
  post_only: { short: "Post only", plain: "The post on your account. No ad use.", days: 0, ads: false },
  post_plus_ads_30: { short: "Post + ads 30 days", plain: "The post, plus the right to run it as a paid ad from your account for 30 days.", days: 30, ads: true },
  post_plus_ads_90: { short: "Post + ads 90 days", plain: "The post, plus the right to run it as a paid ad from your account for 90 days.", days: 90, ads: true },
  post_plus_raw_180: { short: "Post + raw file 180 days", plain: "The post, plus the raw video file for Sophia to use in its own ads for 180 days.", days: 180, ads: true },
};

export const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;
export const FORMATS: Record<(typeof PLATFORMS)[number], string[]> = {
  tiktok: ["post"],
  instagram: ["reel", "story"],
  youtube: ["short", "video"],
};
export type Deliverable = { platform: string; format: string; count: number };

export const TIERS = ["nano", "micro", "mid", "macro", "top"] as const;
export const DEFAULT_RIGHTS_PCT: Record<Rights, number> = { post_only: 0, post_plus_ads_30: 25, post_plus_ads_90: 50, post_plus_raw_180: 75 };

export function parseDeliverables(v: unknown): Deliverable[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((d) => ({ platform: String(d?.platform ?? ""), format: String(d?.format ?? ""), count: Math.max(1, Number(d?.count ?? 1) || 1) }))
    .filter((d) => d.platform && d.format);
}

export function deliverableLabel(d: Deliverable) {
  const p = d.platform === "tiktok" ? "TikTok" : d.platform === "instagram" ? "Instagram" : "YouTube";
  return `${d.count} × ${p} ${d.format}`;
}

type RateCard = { rate_tiktok?: number | string | null; rate_reel?: number | string | null; rate_youtube?: number | string | null };

/** Base price from the influencer's rate card; null when a needed rate is missing. */
export function basePrice(rates: RateCard, deliverables: Deliverable[]): number | null {
  let total = 0;
  for (const d of deliverables) {
    const rate = d.platform === "tiktok" ? rates.rate_tiktok : d.platform === "instagram" ? rates.rate_reel : rates.rate_youtube;
    if (rate == null || rate === "") return null;
    total += Number(rate) * d.count;
  }
  return total;
}

export function withRightsFee(base: number, rights: Rights, pct: Partial<Record<string, number>> | null | undefined) {
  const p = Number(pct?.[rights] ?? DEFAULT_RIGHTS_PCT[rights]);
  const fee = Math.round(base * p) / 100;
  return { fixed: base, rights_fee: fee, rights_pct: p, total: Math.round((base + fee) * 100) / 100 };
}

export function cpm(price: number, views7d: number | null | undefined) {
  if (!views7d) return null;
  return Math.round((price / (views7d / 1000)) * 100) / 100;
}

export const DEAL_COLUMNS = ["accepted", "in_production", "draft_submitted", "draft_approved", "posted", "metrics_pending", "completed"] as const;
export const DEAL_LABEL: Record<string, string> = {
  accepted: "Accepted",
  in_production: "In production",
  draft_submitted: "Draft submitted",
  draft_approved: "Draft approved",
  changes_requested: "Changes requested",
  posted: "Posted",
  metrics_pending: "Metrics pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const CHECKPOINTS = [
  { id: "48h", hours: 48 },
  { id: "7d", hours: 168 },
  { id: "30d", hours: 720 },
] as const;

export function checkpointOpen(postedAt: string | null, id: string) {
  if (!postedAt) return false;
  const c = CHECKPOINTS.find((x) => x.id === id);
  return Boolean(c) && Date.now() - new Date(postedAt).getTime() >= c!.hours * 3600e3;
}

export function euros(n: number | string | null | undefined) {
  if (n == null || n === "") return "—";
  return `€${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

export function daysLeft(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400e3);
}

export function timeLeft(iso: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600e3);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : `${h}h ${Math.floor((ms % 3600e3) / 60e3)}m left`;
}
