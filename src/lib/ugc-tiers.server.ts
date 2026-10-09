// Server-only: tier promotion/demotion (on the 1st), one-time and streak bonuses, awards.
import { streakDays, tierFor } from "./ugc-tiers";

type Admin = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function runTierJob(a: Admin, opts: { promote?: boolean } = {}) {
  const now = new Date();
  const promote = opts.promote ?? now.getUTCDate() === 1;
  const period = now.toISOString().slice(0, 7);
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const [{ data: creators }, { data: posts }, { data: s }, { data: existing }] = await Promise.all([
    a.from("creators").select("id, created_at, tier, tier_locked, track").eq("track", "ugc"),
    a.from("creator_posts").select("creator_id, status, posted_on, created_at, views").eq("status", "approved"),
    a.from("ugc_settings").select("ten_post_bonus, streak7_bonus, streak30_bonus").eq("id", 1).maybeSingle(),
    a.from("awards").select("creator_id, kind, period"),
  ]);
  const have = new Set((existing ?? []).map((r: any) => `${r.creator_id}|${r.kind}|${r.period}`));
  const by = new Map<string, any[]>();
  for (const p of posts ?? []) by.set(p.creator_id, [...(by.get(p.creator_id) ?? []), p]);
  const prevViews = (creators ?? []).map((c: any) => ({ id: c.id, v: (by.get(c.id) ?? []).filter((p) => (p.posted_on ?? p.created_at).startsWith(prev)).reduce((x, p) => x + Number(p.views ?? 0), 0) }))
    .filter((r: any) => r.v > 0).sort((x: any, y: any) => y.v - x.v);
  const topN = Math.max(1, Math.ceil(prevViews.length * 0.1));
  const top = new Set(prevViews.slice(0, topN).map((r: any) => r.id));
  let changed = 0, awarded = 0, bonuses = 0;

  async function award(creatorId: string, kind: string, per = "", bonus = 0, label = "") {
    const key = `${creatorId}|${kind}|${per}`;
    if (have.has(key)) return;
    have.add(key);
    const { error } = await a.from("awards").insert({ creator_id: creatorId, kind, period: per });
    if (error) return;
    awarded++;
    if (bonus > 0) {
      await a.from("payout_adjustments").insert({ creator_id: creatorId, period, amount: bonus, reason: label });
      bonuses++;
    }
    await a.from("creator_notifications").insert({ creator_id: creatorId, body: bonus > 0 ? `New award: ${label} (+${bonus} €)` : `New award: ${label}` });
  }

  for (const c of creators ?? []) {
    const list = by.get(c.id) ?? [];
    const days = list.map((p) => String(p.posted_on ?? p.created_at).slice(0, 10));
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const posts30 = days.filter((d) => d >= since30).length;
    if (promote && !c.tier_locked) {
      const next = tierFor({ daysSinceStart: (Date.now() - new Date(c.created_at).getTime()) / 86400_000, approvedLast30: posts30, topTenPrevMonth: top.has(c.id) });
      if (next !== c.tier) {
        await a.from("creators").update({ tier: next, tier_since: new Date().toISOString() }).eq("id", c.id);
        await a.from("creator_notifications").insert({ creator_id: c.id, body: `Your tier is now ${next[0]!.toUpperCase()}${next.slice(1)}.` });
        changed++;
      }
    }
    if (list.length >= 1) await award(c.id, "first_step", "", 0, "First Step");
    if (list.length >= 10) await award(c.id, "ten_posts", "", Number(s?.ten_post_bonus ?? 20), "10 approved posts");
    const streak = streakDays(days);
    if (streak >= 7) await award(c.id, "streak_7", period, Number(s?.streak7_bonus ?? 10), "7-day streak");
    if (streak >= 30) await award(c.id, "streak_30", period, Number(s?.streak30_bonus ?? 50), "30-day streak");
    const max = Math.max(0, ...list.map((p) => Number(p.views ?? 0)));
    if (max >= 10_000) await award(c.id, "views_10k", "", 0, "10K views post");
    if (max >= 100_000) await award(c.id, "views_100k", "", 0, "100K views post");
    if (promote && top.has(c.id)) await award(c.id, "top10_month", prev, 0, `Top 10 of ${prev}`);
  }
  return { promote, changed, awarded, bonuses };
}
