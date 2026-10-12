import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppBadge, useAdminApp } from "@/lib/apps";

/** Monday 00:00 Paris (approximated in UTC+1/+2 by using local Monday of the Paris date). */
function mondayParis() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const d = new Date(now); d.setDate(now.getDate() - ((now.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/** Active UGC creators: name, app, posts this week, last post, status. */
export function UgcCreatorsList() {
  const { appId } = useAdminApp();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["hub", "ugc-creators-simple", appId],
    queryFn: async () => {
      const [c, posts] = await Promise.all([
        supabase.from("creators").select("id, full_name, status, ugc_status, email_pending, creator_apps(app_id)").eq("track", "ugc").order("full_name").limit(1000),
        supabase.from("creator_posts").select("creator_id, posted_on, created_at, app_id").order("created_at", { ascending: false }).limit(5000),
      ]);
      return { creators: c.data ?? [], posts: posts.data ?? [] };
    },
  });
  const rows = useMemo(() => {
    const monday = mondayParis();
    const stats = new Map<string, { week: number; last: string | null }>();
    for (const p of data?.posts ?? []) {
      if (appId && p.app_id && p.app_id !== appId) continue;
      const day = (p.posted_on ?? p.created_at).slice(0, 10);
      const s = stats.get(p.creator_id) ?? { week: 0, last: null };
      if (day >= monday) s.week++;
      if (!s.last || day > s.last) s.last = day;
      stats.set(p.creator_id, s);
    }
    return (data?.creators ?? [])
      .map((c) => ({ ...c, apps: ((c.creator_apps ?? []) as { app_id: string }[]).map((a) => a.app_id), s: stats.get(c.id) }))
      .filter((c) => (!appId || c.apps.includes(appId)) && (!q || c.full_name.toLowerCase().includes(q.toLowerCase())));
  }, [data, appId, q]);
  return (
    <div className="space-y-3">
      <input aria-label="Search creators" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 w-full rounded-lg border bg-card px-3 text-sm sm:w-72" />
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        {isLoading ? <p className="p-5 text-sm text-brand-navySoft">Loading…</p> : rows.length ? (
          <table className="w-full min-w-[560px] text-sm" data-testid="ugc-creators">
            <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Name</th><th className="p-3">App</th><th className="p-3">Posts this week</th><th className="p-3">Last post</th><th className="p-3">Status</th></tr></thead>
            <tbody>{rows.map((c) => (
              <tr key={c.id} className="border-t border-brand-line">
                <td className="p-3 font-bold"><Link to="/hub/ugc/creators/$creatorId" params={{ creatorId: c.id }} className="text-brand-navy hover:underline">{c.full_name}</Link>{c.email_pending ? <span className="ml-2 text-xs font-normal text-portal-amber">email pending</span> : null}</td>
                <td className="p-3"><span className="flex flex-wrap gap-1">{c.apps.map((a) => <AppBadge key={a} appId={a} />)}</span></td>
                <td className="p-3">{c.s?.week ?? 0}</td>
                <td className="p-3 text-brand-navySoft">{c.s?.last ? new Date(c.s.last).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</td>
                <td className="p-3 capitalize">{(c.ugc_status ?? c.status ?? "active").replace(/_/g, " ")}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="p-5 text-sm text-brand-navySoft">No creators yet.</p>}
      </div>
    </div>
  );
}
