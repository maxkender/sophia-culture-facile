import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminApp } from "@/lib/apps";

/** UGC Home: three numbers and one next step. Nothing else. */
export function UgcHome() {
  const { appId } = useAdminApp();
  const { data } = useQuery({
    queryKey: ["hub", "ugc-home", appId],
    queryFn: async () => {
      const ins = supabase.from("inspirations").select("id, app_id").eq("status", "analyzed").limit(2000);
      let used = supabase.from("briefs").select("inspiration_id").not("inspiration_id", "is", null);
      let pub = supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "published").neq("brief_type", "format");
      let posts = supabase.from("creator_posts").select("id, creators!inner(is_test)", { count: "exact", head: true }).eq("status", "pending").eq("creators.is_test", false);
      if (appId) { used = used.eq("app_id", appId); pub = pub.eq("app_id", appId); posts = posts.eq("app_id", appId); }
      const [i, u, p, q] = await Promise.all([ins, used, pub, posts]);
      const done = new Set((u.data ?? []).map((r) => r.inspiration_id as string));
      const toReview = (i.data ?? []).filter((r) => (!appId || !r.app_id || r.app_id === appId) && !done.has(r.id)).length;
      return { toReview, published: p.count ?? 0, toValidate: q.count ?? 0 };
    },
  });
  const n = data;
  const next = !n ? null
    : n.toValidate ? { text: `Validate ${n.toValidate} post${n.toValidate > 1 ? "s" : ""} waiting for you.`, to: "/hub/ugc/posts" as const }
    : n.toReview ? { text: `Open an inspiration and press “Make a brief”.`, to: "/hub/ugc/inspiration" as const }
    : n.published === 0 ? { text: "Write your first brief.", to: "/hub/ugc/briefs" as const }
    : { text: "Add new inspiration links.", to: "/hub/ugc/inspiration" as const };
  const big: [string, number | undefined, "/hub/ugc/inspiration" | "/hub/ugc/briefs" | "/hub/ugc/posts"][] = [
    ["Inspirations to review", n?.toReview, "/hub/ugc/inspiration"],
    ["Briefs published", n?.published, "/hub/ugc/briefs"],
    ["Posts to validate", n?.toValidate, "/hub/ugc/posts"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {big.map(([l, v, to]) => (
          <Link key={l} to={to} className="rounded-2xl bg-card p-6 shadow-portal transition hover:-translate-y-0.5" data-testid="ugc-home-kpi">
            <p className="text-5xl font-extrabold text-brand-navy">{v ?? "…"}</p>
            <p className="mt-2 text-sm font-bold text-brand-navySoft">{l}</p>
          </Link>
        ))}
      </div>
      {next ? <p className="rounded-2xl bg-card p-5 text-base text-brand-navy shadow-portal" data-testid="ugc-next-step"><b>Next step:</b> {next.text} <Link to={next.to} className="font-bold text-portal-accent underline">Go →</Link></p> : null}
    </div>
  );
}
