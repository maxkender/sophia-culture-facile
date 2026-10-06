/** Client-safe UGC pay model: fixed part prorated by quota + RPM on views at D+7, capped per video. */

export type RateCard = {
  fixed_monthly: number;
  rpm_eur_per_1000: number;
  cap_per_video: number;
  prorate_fixed_by_quota: boolean;
  currency: string;
};

export type PayCreator = {
  posts_per_month: number | null;
  required_platforms: string;
  fixed_monthly_override: number | null;
  rpm_override: number | null;
  cap_override: number | null;
};

export type PayPost = {
  id: string;
  platform: string;
  url: string | null;
  posted_at: string | null;
  views_7d: number | null;
  views_7d_at: string | null;
  excluded: boolean;
};

export type MonthBreakdown = {
  period: string;
  currency: string;
  target: number;
  postsCounted: number;
  fixedMonthly: number;
  prorate: boolean;
  fixedPart: number;
  rpm: number;
  cap: number;
  bonusPart: number;
  adjustmentsPart: number;
  total: number;
  posts: { id: string; platform: string; url: string | null; posted_at: string | null; views_7d: number | null; bonus: number; capped: boolean }[];
  adjustments: { amount: number; reason: string }[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function periodBounds(period: string) {
  const [y, m] = period.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

export function platformAllowed(required: string, platform: string) {
  return required === "both" || required === platform;
}

export function effectiveTerms(c: PayCreator, rate: RateCard, defaultTarget: number) {
  return {
    target: c.posts_per_month ?? defaultTarget,
    fixed: c.fixed_monthly_override ?? Number(rate.fixed_monthly),
    rpm: c.rpm_override ?? Number(rate.rpm_eur_per_1000),
    cap: c.cap_override ?? Number(rate.cap_per_video),
  };
}

/**
 * Posts counted = posted in the month on required platforms, not excluded.
 * Bonus = every post whose D+7 views landed in the month (so late-month posts roll into next month, never lost).
 */
export function computeMonth(
  period: string,
  creator: PayCreator,
  rate: RateCard,
  defaultTarget: number,
  posts: PayPost[],
  adjustments: { amount: number; reason: string }[] = [],
): MonthBreakdown {
  const { start, end } = periodBounds(period);
  const t = effectiveTerms(creator, rate, defaultTarget);
  const inMonth = (iso: string | null) => !!iso && new Date(iso) >= start && new Date(iso) < end;
  const eligible = posts.filter((p) => !p.excluded && platformAllowed(creator.required_platforms, p.platform));
  const postsCounted = eligible.filter((p) => inMonth(p.posted_at)).length;
  const fixedPart = rate.prorate_fixed_by_quota
    ? round2(t.fixed * Math.min(1, t.target > 0 ? postsCounted / t.target : 0))
    : postsCounted >= t.target ? t.fixed : 0;
  const bonusPosts = eligible
    .filter((p) => p.views_7d != null && inMonth(p.views_7d_at))
    .map((p) => {
      const raw = (Number(p.views_7d) / 1000) * t.rpm;
      const capped = raw > t.cap;
      return { id: p.id, platform: p.platform, url: p.url, posted_at: p.posted_at, views_7d: p.views_7d, bonus: round2(Math.min(raw, t.cap)), capped };
    });
  const bonusPart = round2(bonusPosts.reduce((s, p) => s + p.bonus, 0));
  const adjustmentsPart = round2(adjustments.reduce((s, a) => s + Number(a.amount), 0));
  return {
    period,
    currency: rate.currency,
    target: t.target,
    postsCounted,
    fixedMonthly: t.fixed,
    prorate: rate.prorate_fixed_by_quota,
    fixedPart,
    rpm: t.rpm,
    cap: t.cap,
    bonusPart,
    adjustmentsPart,
    total: round2(fixedPart + bonusPart + adjustmentsPart),
    posts: bonusPosts,
    adjustments,
  };
}

/** Pace = target × days elapsed / days in month. */
export function paceTarget(target: number, now = new Date()) {
  const days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  return (target * now.getUTCDate()) / days;
}

export const currentPeriod = (d = new Date()) => d.toISOString().slice(0, 7);
export const previousPeriod = (d = new Date()) => {
  const p = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
  return p.toISOString().slice(0, 7);
};
export const fmtMoney = (n: number, cur = "EUR") => new Intl.NumberFormat("en-GB", { style: "currency", currency: cur }).format(n);
