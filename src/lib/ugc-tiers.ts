/** Client-safe tier rules and tier-based monthly pay. */
import { periodBounds, platformAllowed, type MonthBreakdown, type PayCreator, type PayPost } from "./ugc-pay";

export type Tier = "trial" | "active" | "pro";
export type TierTerms = { tier: Tier; per_post: number; cpm: number; cap_per_post: number };
export type TierCreator = PayCreator & { per_post_override?: number | null };
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
  const postsCounted = eligible.filter((p) => inMonth(p.posted_at)).length;
  const fixedPart = round2(postsCounted * perPost);
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
  };
}
