// Server-only monthly UGC computation shared by admin functions and the scheduled route.
import { computeTierMonth, type Tier } from "./ugc-tiers";
import { computeMonth, periodBounds, type MonthBreakdown, type RateCard } from "./ugc-pay";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function activeRateCard(admin: Admin, period: string): Promise<RateCard> {
  const { end } = periodBounds(period);
  const { data } = await admin.from("ugc_rate_cards").select("*").lt("effective_from", end.toISOString().slice(0, 10)).order("effective_from", { ascending: false }).limit(1).maybeSingle();
  return data ?? { fixed_monthly: 100, rpm_eur_per_1000: 1, cap_per_video: 300, prorate_fixed_by_quota: true, currency: "EUR" };
}

export async function computeCreatorMonth(admin: Admin, creatorId: string, period: string) {
  const [{ data: c }, rate, { data: s }] = await Promise.all([
    admin.from("creators").select("id, full_name, country, posts_per_month, required_platforms, fixed_monthly_override, per_post_override, rpm_override, cap_override, resign_required_at, tier, min_talking_head_per_month").eq("id", creatorId).maybeSingle(),
    activeRateCard(admin, period),
    admin.from("ugc_settings").select("default_posts_per_month").eq("id", 1).maybeSingle(),
  ]);
  if (!c) throw new Error("Creator not found");
  const { start, end } = periodBounds(period);
  const [{ data: posts }, { data: adj }] = await Promise.all([
    admin.from("external_posts").select("id, platform, url, posted_at, views_7d, views_7d_at, excluded, effort, briefs(effort)").eq("creator_id", creatorId)
      .or(`and(posted_at.gte.${start.toISOString()},posted_at.lt.${end.toISOString()}),and(views_7d_at.gte.${start.toISOString()},views_7d_at.lt.${end.toISOString()})`),
    admin.from("payout_adjustments").select("amount, reason").eq("creator_id", creatorId).eq("period", period),
  ]);
  const withEffort = (posts ?? []).map((p: any) => ({ ...p, effort: p.effort ?? p.briefs?.effort ?? null }));
  const adjustments = (adj ?? []).map((a: any) => ({ amount: Number(a.amount), reason: a.reason }));
  const { data: enrol } = await admin.from("creator_apps").select("app_id").eq("creator_id", creatorId).eq("status", "active").limit(1).maybeSingle();
  const { data: tier } = await admin.from("ugc_tiers").select("tier, per_post, cpm, cap_per_post, per_post_pov, per_post_reaction, per_post_talking_head").eq("tier", c.tier ?? "trial").eq("app_id", enrol?.app_id ?? "00000000-0000-4000-8000-000000000001").maybeSingle();
  // Tiers replace the single rate card; the rate card stays as fallback when no tier row exists.
  const breakdown = tier
    ? computeTierMonth(period, c, { tier: tier.tier as Tier, per_post: Number(tier.per_post), cpm: Number(tier.cpm), cap_per_post: Number(tier.cap_per_post), per_post_pov: Number(tier.per_post_pov), per_post_reaction: Number(tier.per_post_reaction), per_post_talking_head: Number(tier.per_post_talking_head) }, withEffort, adjustments)
    : computeMonth(period, c, rate, s?.default_posts_per_month ?? 20, posts ?? [], adjustments);
  return { creator: c, breakdown };
}

async function holdReason(admin: Admin, c: any): Promise<string | null> {
  const [{ data: p }, { data: sig }] = await Promise.all([
    admin.from("creator_payout_profiles").select("stripe_onboarded, method, wise_email, paypal_email, siret, bank_iban").eq("creator_id", c.id).maybeSingle(),
    admin.from("creator_signatures").select("document_version").eq("creator_id", c.id).maybeSingle(),
  ]);
  const verified = p && (p.stripe_onboarded || (p.method === "wise" && p.wise_email) || (p.method === "paypal" && p.paypal_email) || (p.method === "bank" && p.bank_iban));
  if (!verified) return "No verified payout profile";
  if ((c.country ?? "").toLowerCase().match(/^(fr|france)$/) && !p?.siret) return "Missing SIRET (France)";
  if (c.resign_required_at && Number(sig?.document_version ?? 0) < 3) return "Agreement v3 not signed";
  return null;
}

export async function previewMonth(admin: Admin, period: string) {
  const { data: creators } = await admin.from("creators").select("id, full_name").eq("track", "ugc").not("user_id", "is", null);
  const out: { creatorId: string; name: string; breakdown: MonthBreakdown }[] = [];
  for (const c of creators ?? []) {
    const r = await computeCreatorMonth(admin, c.id, period);
    out.push({ creatorId: c.id, name: c.full_name, breakdown: r.breakdown });
  }
  return out;
}

/** Creates (or refreshes draft) one payout item per creator for the period. */
export async function generateMonth(admin: Admin, period: string, createdBy: string | null) {
  let { data: batch } = await admin.from("payout_batches").select("id, status").eq("period", period).maybeSingle();
  if (batch && batch.status !== "draft") throw new Error(`The ${period} batch is already ${batch.status}.`);
  if (!batch) {
    const ins = await admin.from("payout_batches").insert({ period, status: "draft", created_by: createdBy }).select("id, status").single();
    batch = ins.data;
  }
  await admin.from("payout_items").delete().eq("batch_id", batch.id).in("status", ["accrued", "held", "pending"]);
  const { referralAdjustments } = await import("./hub-automation.server");
  const lines = await referralAdjustments(admin, period, await previewMonth(admin, period));
  const rows = await previewMonth(admin, period);
  let created = 0; void lines;
  for (const r of rows) {
    if (r.breakdown.total <= 0) continue;
    const { data: c } = await admin.from("creators").select("id, country, resign_required_at").eq("id", r.creatorId).maybeSingle();
    const hold = await holdReason(admin, c);
    await admin.from("payout_items").insert({
      batch_id: batch.id, creator_id: r.creatorId, period, currency: r.breakdown.currency,
      amount: r.breakdown.total, amount_usd: r.breakdown.total, rate_usd: 0, posts_count: r.breakdown.postsCounted,
      fixed_part: r.breakdown.fixedPart, bonus_part: r.breakdown.bonusPart, adjustments_part: r.breakdown.adjustmentsPart,
      breakdown: r.breakdown, status: hold ? "held" : "accrued", hold_reason: hold,
    });
    created++;
  }
  return { batchId: batch.id, items: created };
}
