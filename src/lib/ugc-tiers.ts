/** Client-safe tier rules and tier-based monthly pay. */
import { periodBounds, platformAllowed, type MonthBreakdown, type PayCreator, type PayPost } from "./ugc-pay";

export type Tier = "trial" | "active" | "pro";
export type Effort = "pov" | "reaction" | "talking_head";
export const EFFORT_LABEL: Record<Effort, string> = { pov: "POV", reaction: "Reaction", talking_head: "Face cam" };
export type TierTerms = { tier: Tier; per_post: number; cpm: number; cap_per_post: number; per_post_pov?: number; per_post_reaction?: number; per_post_talking_head?: number };
/** Per-post rate for a format effort; falls back to the tier's single per-post rate. */
export function ratePerEffort(t: TierTerms, effort: Effort | null | undefined) {
  if (effort === "pov" && t.per_post_pov != null) return Number(t.per_post_pov);
  if (effort === "reaction" && t.per_post_reaction != null) return Number(t.per_post_reaction);
  if (effort === "talking_head" && t.per_post_talking_head != null) return Number(t.per_post_talking_head);
  return Number(t.per_post);
}
export type TierCreator = PayCreator & { per_post_override?: number | null; min_talking_head_per_month?: number | null };
export const TIER_LABEL: Record<Tier, string> = { trial: "Trial", active: "Active", pro: "Pro" };
export const ACTIVE_POSTS = 20;

export function tierFor(x: { daysSinceStart: number; approvedLast30: number; topTenPrevMonth: boolean }): Tier {
  if (x.approvedLast30 >= ACTIVE_POSTS && x.topTenPrevMonth) return "pro";
  if (x.approvedLast30 >= ACTIVE_POSTS) return "active";
  return "trial";
}

/** Consecutive posting days ending today (or yesterday). */
export function streakDays(days: string[], now = new Date()) {
  const set = new Set(days.map((d) => d.slice(0, 10)));
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
    if (set.has(d)) n++;
    else if (i > 0) break;
  }
  return n;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Tier pay: per approved post + CPM on D+7 views, each post's views bonus capped at cap_per_post.
 * No monthly ceiling at tier level — the only monthly ceiling is ugc_settings.monthly_budget_cap (queues posts to next month).
 * Instagram pays base only (views unreliable). Overrides: per_post_override, rpm_override, cap_override (per post).
 */
export function computeTierMonth(period: string, creator: TierCreator, t: TierTerms, posts: PayPost[], adjustments: { amount: number; reason: string }[] = []): MonthBreakdown {
  const { start, end } = periodBounds(period);
  const inMonth = (iso: string | null) => !!iso && new Date(iso) >= start && new Date(iso) < end;
  const perPost = creator.per_post_override ?? t.per_post;
  const cpm = creator.rpm_override ?? t.cpm;
  const cap = creator.cap_override ?? t.cap_per_post;
  const eligible = posts.filter((p) => !p.excluded && platformAllowed(creator.required_platforms, p.platform));
  const counted = eligible.filter((p) => inMonth(p.posted_at));
  const postsCounted = counted.length;
  // Per-post pay by format effort; a per-creator per_post_override replaces all three rates.
  const effortLines = (["pov", "reaction", "talking_head"] as Effort[]).map((e) => {
    const n = counted.filter((p) => ((p as PayPost & { effort?: Effort | null }).effort ?? "talking_head") === e).length;
    const rate = creator.per_post_override ?? ratePerEffort(t, e);
    return { effort: e, posts: n, rate, amount: round2(n * rate) };
  });
  const rawFixed = round2(effortLines.reduce((s, l) => s + l.amount, 0));
  const minTh = creator.min_talking_head_per_month ?? 0;
  const th = effortLines.find((l) => l.effort === "talking_head")?.posts ?? 0;
  // Below the monthly face-cam minimum, the per-post part is prorated (th / minimum).
  const fixedPart = minTh > 0 && th < minTh ? round2(rawFixed * (th / minTh)) : rawFixed;
  const bonusPosts = eligible.filter((p) => p.platform !== "instagram" && p.views_7d != null && inMonth(p.views_7d_at))
    .map((p) => {
      const raw = (Number(p.views_7d) / 1000) * cpm;
      const capped = cap > 0 && raw > cap;
      return { id: p.id, platform: p.platform, url: p.url, posted_at: p.posted_at, views_7d: p.views_7d, bonus: round2(capped ? cap : raw), capped };
    });
  const bonusPart = round2(bonusPosts.reduce((s, p) => s + p.bonus, 0));
  const fixedCapped = fixedPart;
  const adjustmentsPart = round2(adjustments.reduce((s, a) => s + Number(a.amount), 0));
  return {
    period, currency: "EUR", target: 0, postsCounted, fixedMonthly: perPost, prorate: false, fixedPart: fixedCapped,
    rpm: cpm, cap, bonusPart, adjustmentsPart, total: round2(fixedCapped + bonusPart + adjustmentsPart), posts: bonusPosts, adjustments,
    effortLines, talkingHead: { done: th, min: minTh },
  };
}
