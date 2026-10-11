import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminApp } from "@/lib/apps";

export type SetupStep = { title: string; subtitle: string; done: boolean; to: string };

/** Five-step setup checklist, derived from real data per selected app. */
export function useSetupChecklist(): SetupStep[] {
  const { appId } = useAdminApp();
  const { data } = useQuery({
    queryKey: ["hub", "setup", appId],
    queryFn: async () => {
      const f = <T,>(q: T) => q;
      const scope = (table: "campaigns" | "creator_posts" | "post_metrics_daily") => {
        const q = supabase.from(table as "campaigns").select("id", { count: "exact", head: true });
        return appId ? q.eq("app_id", appId) : q;
      };
      const [c, m, s, p, t] = await Promise.all([
        scope("campaigns"),
        f(supabase.from("creator_messages").select("id", { count: "exact", head: true }).eq("from_admin", true)),
        f(supabase.from("creators").select("id", { count: "exact", head: true }).not("onboarding_completed_at", "is", null)),
        appId ? supabase.from("creator_posts").select("id", { count: "exact", head: true }).eq("app_id", appId) : supabase.from("creator_posts").select("id", { count: "exact", head: true }),
        scope("post_metrics_daily"),
      ]);
      return [c.count ?? 0, m.count ?? 0, s.count ?? 0, p.count ?? 0, t.count ?? 0];
    },
  });
  const [n0 = 0, n1 = 0, n2 = 0, n3 = 0, n4 = 0] = data ?? [];
  const n = [n0, n1, n2, n3, n4] as const;
  return [
    { title: "Publish a job", subtitle: "The brief, the pay and who can apply", done: n[0] > 0, to: "/hub/ugc/campaigns/create" },
    { title: "Answer your applicants", subtitle: "A short hello and their questions", done: n[1] > 0, to: "/hub/ugc/messages" },
    { title: "Sign your first creator", subtitle: "Invite and agreement", done: n[2] > 0, to: "/hub/ugc/creators" },
    { title: "Get the first video online", subtitle: "Approve a first video", done: n[3] > 0, to: "/hub/ugc/campaigns" },
    { title: "Read your numbers", subtitle: "Views arrive every day", done: n[4] > 0, to: "/hub/ugc/analytics" },
  ];
}

export type DailyPoint = { day: string; views: number; likes: number; comments: number; shares: number; engagement: number };

export function usePerformance(days = 30) {
  const { appId } = useAdminApp();
  return useQuery({
    queryKey: ["hub", "perf", appId, days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 2 * 86400_000).toISOString().slice(0, 10);
      let q = supabase.from("post_metrics_daily").select("day, views, likes, comments, shares").gte("day", since).limit(10000);
      if (appId) q = q.eq("app_id", appId);
      const { data } = await q;
      const byDay = new Map<string, DailyPoint>();
      for (const r of data ?? []) {
        const d = byDay.get(r.day) ?? { day: r.day, views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
        d.views += Number(r.views); d.likes += Number(r.likes); d.comments += Number(r.comments); d.shares += Number(r.shares);
        byDay.set(r.day, d);
      }
      const all: DailyPoint[] = [];
      for (let i = days * 2 - 1; i >= 0; i--) {
        const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
        const d = byDay.get(day) ?? { day, views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
        d.engagement = d.likes + d.comments + d.shares;
        all.push(d);
      }
      return { prev: all.slice(0, days), cur: all.slice(days) };
    },
  });
}

/** Money picture: committed = approved/unpaid payout lines this month; pending = posts in hold. */
export function useWallet() {
  const { appId } = useAdminApp();
  return useQuery({
    queryKey: ["hub", "wallet", appId],
    queryFn: async () => {
      let owed = supabase.from("payout_items").select("amount, amount_usd, status, app_id").in("status", ["approved", "pending", "ready"]);
      if (appId) owed = owed.eq("app_id", appId);
      let camp = supabase.from("campaigns").select("monthly_budget").eq("status", "live");
      if (appId) camp = camp.eq("app_id", appId);
      let hold = supabase.from("creator_posts").select("amount_usd, created_at").eq("status", "pending");
      if (appId) hold = hold.eq("app_id", appId);
      const [o, c, h] = await Promise.all([owed, camp, hold]);
      const sum = (rows: { amount?: number | null; amount_usd?: number | null }[] | null) => (rows ?? []).reduce((a, r) => a + Number(r.amount ?? r.amount_usd ?? 0), 0);
      const budget = (c.data ?? []).reduce((a, r) => a + Number(r.monthly_budget ?? 0), 0);
      const currentlyOwed = sum(o.data);
      const pending = sum(h.data as never);
      return { budget, currentlyOwed, pending, available: Math.max(0, budget - currentlyOwed - pending) };
    },
  });
}

export function eur(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
}
export function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
export function flag(country: string | null | undefined) {
  const c = (country ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
