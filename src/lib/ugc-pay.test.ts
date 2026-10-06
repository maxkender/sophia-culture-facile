import { describe, expect, it } from "vitest";
import { computeMonth, type PayPost } from "./ugc-pay";

const rate = { fixed_monthly: 100, rpm_eur_per_1000: 1, cap_per_video: 300, prorate_fixed_by_quota: true, currency: "EUR" };
const creator = { posts_per_month: 8, required_platforms: "both", fixed_monthly_override: null, rpm_override: null, cap_override: null };
const post = (id: string, posted: string, views: number | null, at: string | null, extra: Partial<PayPost> = {}): PayPost => ({
  id, platform: "tiktok", url: null, posted_at: posted, views_7d: views, views_7d_at: at, excluded: false, ...extra,
});

describe("computeMonth", () => {
  it("prorates fixed pay and caps per-video bonus", () => {
    const m = computeMonth("2026-09", creator, rate, 8, [
      post("a", "2026-09-03T10:00:00Z", 50_000, "2026-09-10T10:00:00Z"),
      post("b", "2026-09-05T10:00:00Z", 400_000, "2026-09-12T10:00:00Z"),
    ]);
    expect(m.fixedPart).toBe(25);
    expect(m.bonusPart).toBe(350);
    expect(m.posts.find((p) => p.id === "b")?.capped).toBe(true);
    expect(m.total).toBe(375);
  });

  it("rolls late-month views into next month and skips excluded or wrong-platform posts", () => {
    const posts = [
      post("late", "2026-09-28T10:00:00Z", 10_000, "2026-10-05T10:00:00Z"),
      post("x", "2026-09-10T10:00:00Z", 10_000, "2026-09-17T10:00:00Z", { excluded: true }),
      post("ig", "2026-09-10T10:00:00Z", 10_000, "2026-09-17T10:00:00Z", { platform: "instagram" }),
    ];
    const sep = computeMonth("2026-09", { ...creator, required_platforms: "tiktok" }, rate, 8, posts);
    expect(sep.postsCounted).toBe(1);
    expect(sep.bonusPart).toBe(0);
    const oct = computeMonth("2026-10", { ...creator, required_platforms: "tiktok" }, rate, 8, posts);
    expect(oct.bonusPart).toBe(10);
  });

  it("adds adjustments and caps fixed at 100%", () => {
    const many = Array.from({ length: 12 }, (_, i) => post(String(i), "2026-09-02T10:00:00Z", null, null));
    const m = computeMonth("2026-09", creator, rate, 8, many, [{ amount: -5, reason: "late" }]);
    expect(m.fixedPart).toBe(100);
    expect(m.total).toBe(95);
  });
});
