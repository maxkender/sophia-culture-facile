import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAdminApp } from "@/lib/apps";
import { compact, eur } from "./hub-data";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const iso = (d: Date) => d.toISOString().slice(0, 10);

function csv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.error("Nothing to export"); return; }
  const keys = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob([[keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

function Breakdown({ title, rows }: { title: string; rows: { k: string; posts: number; views: number }[] }) {
  return (
    <div className={card}>
      <h3 className="font-extrabold text-brand-navy">{title}</h3>
      {rows.length === 0 ? <p className="mt-2 text-sm text-brand-navySoft">No data in this range.</p> : (
        <ul className="mt-2 divide-y divide-brand-line text-sm">{rows.slice(0, 10).map((r) => (
          <li key={r.k} className="flex justify-between gap-2 py-2"><span className="truncate text-brand-navy">{r.k}</span><span className="shrink-0 text-brand-navySoft">{r.posts} posts · {compact(r.views)} views</span></li>
        ))}</ul>
      )}
    </div>
  );
}

function InstallsForm({ appId }: { appId: string | null }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ handle: "", week: iso(new Date(Date.now() - ((new Date().getDay() + 6) % 7) * 86400_000)), installs: "", spend: "" });
  async function save() {
    if (!f.handle.trim()) { toast.error("Enter the creator's handle."); return; }
    const { error } = await supabase.from("weekly_installs").upsert({ handle: f.handle.replace(/^@/, "").toLowerCase(), week_start: f.week, installs: Number(f.installs || 0), spend: Number(f.spend || 0), app_id: appId }, { onConflict: "handle,week_start" });
    if (error) toast.error("Could not save."); else { toast.success("Saved"); setF((x) => ({ ...x, handle: "", installs: "", spend: "" })); void qc.invalidateQueries({ queryKey: ["hub", "analytics"] }); }
  }
  const i = "min-h-10 rounded-xl border px-3 text-sm";
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-5">
      <input aria-label="Handle" placeholder="@handle" className={i} value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} />
      <input aria-label="Week starting" type="date" className={i} value={f.week} onChange={(e) => setF({ ...f, week: e.target.value })} />
      <input aria-label="Installs" type="number" min={0} placeholder="Installs" className={i} value={f.installs} onChange={(e) => setF({ ...f, installs: e.target.value })} />
      <input aria-label="Ad spend" type="number" min={0} placeholder="Ad spend €" className={i} value={f.spend} onChange={(e) => setF({ ...f, spend: e.target.value })} />
      <Button onClick={() => void save()}>Add week</Button>
    </div>
  );
}

export function Analytics() {
  const { appId } = useAdminApp();
  const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 86400_000)));
  const [to, setTo] = useState(iso(new Date()));
  const { data } = useQuery({
    queryKey: ["hub", "analytics", appId, from, to],
    queryFn: async () => {
      const scope = <T,>(q: T) => (appId ? (q as any).eq("app_id", appId) : q) as T; // eslint-disable-line @typescript-eslint/no-explicit-any
      const [posts, metrics, clicks, installs, creators, pay] = await Promise.all([
        scope(supabase.from("creator_posts").select("id, creator_id, brief_id, platform, format, posted_on, views, status, creators(full_name), briefs(title)").gte("posted_on", from).lte("posted_on", to)).limit(5000),
        scope(supabase.from("post_metrics_daily").select("post_id, day, views, likes, comments, shares").gte("day", from).lte("day", to)).limit(20000),
        scope(supabase.from("go_clicks").select("handle, device, created_at").gte("created_at", from).lte("created_at", `${to}T23:59:59`)).limit(20000),
        scope(supabase.from("weekly_installs").select("*").gte("week_start", from).lte("week_start", to)),
        supabase.from("creators").select("id, user_id, accounts_confirmed_at, tiktok_handle, instagram_handle").eq("track", "ugc"),
        supabase.from("payout_items").select("amount, period, status").gte("period", from.slice(0, 7)).lte("period", to.slice(0, 7)),
      ]);
      return { posts: posts.data ?? [], metrics: metrics.data ?? [], clicks: clicks.data ?? [], installs: installs.data ?? [], creators: creators.data ?? [], pay: pay.data ?? [] };
    },
  });

  const v = useMemo(() => {
    if (!data) return null;
    const days: string[] = [];
    for (let d = new Date(from); iso(d) <= to; d = new Date(d.getTime() + 86400_000)) days.push(iso(d));
    // daily views = growth of each post's latest snapshot per day
    const byPost = new Map<string, { day: string; views: number }[]>();
    for (const m of data.metrics) { const l = byPost.get(m.post_id) ?? []; l.push({ day: m.day, views: Number(m.views) }); byPost.set(m.post_id, l); }
    const viewsByDay = new Map<string, number>();
    for (const l of byPost.values()) { l.sort((a, b) => a.day.localeCompare(b.day)); let prev = 0; for (const s of l) { viewsByDay.set(s.day, (viewsByDay.get(s.day) ?? 0) + Math.max(0, s.views - prev)); prev = s.views; } }
    const postsByDay = new Map<string, number>();
    for (const p of data.posts) postsByDay.set(p.posted_on, (postsByDay.get(p.posted_on) ?? 0) + 1);
    const series = days.map((d) => ({ day: d.slice(5), views: viewsByDay.get(d) ?? 0, posts: postsByDay.get(d) ?? 0 }));
    const totalViews = data.posts.reduce((a, p) => a + Number(p.views ?? 0), 0);
    const posts = data.posts;
    const group = (key: (p: (typeof posts)[number]) => string) => {
      const m = new Map<string, { k: string; posts: number; views: number }>();
      for (const p of posts) { const k = key(p) || "—"; const r = m.get(k) ?? { k, posts: 0, views: 0 }; r.posts++; r.views += Number(p.views ?? 0); m.set(k, r); }
      return [...m.values()].sort((a, b) => b.views - a.views);
    };
    const postCount = new Map<string, number>();
    for (const p of data.posts) postCount.set(p.creator_id, (postCount.get(p.creator_id) ?? 0) + 1);
    const c = data.creators;
    const funnel = [
      ["Signed up", c.filter((x) => x.user_id).length],
      ["Account created", c.filter((x) => x.accounts_confirmed_at || x.tiktok_handle || x.instagram_handle).length],
      ["First post", c.filter((x) => (postCount.get(x.id) ?? 0) >= 1).length],
      ["10 posts", c.filter((x) => (postCount.get(x.id) ?? 0) >= 10).length],
      ["Active", c.filter((x) => (postCount.get(x.id) ?? 0) >= 20).length],
    ] as const;
    const spend = data.pay.reduce((a, p) => a + Number(p.amount ?? 0), 0) + data.installs.reduce((a, r) => a + Number(r.spend ?? 0), 0);
    const installs = data.installs.reduce((a, r) => a + Number(r.installs ?? 0), 0);
    return {
      series, totalViews, funnel, spend, installs, clicks: data.clicks.length,
      approved: data.posts.filter((p) => p.status === "approved").length,
      creators: new Set(data.posts.map((p) => p.creator_id)).size,
      byCreator: group((p) => (p.creators as { full_name?: string } | null)?.full_name ?? ""),
      byBrief: group((p) => (p.briefs as { title?: string } | null)?.title ?? "No brief"),
      byPlatform: group((p) => p.platform ?? ""),
      byFormat: group((p) => p.format ?? "Unknown"),
    };
  }, [data, from, to]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-brand-navySoft">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block min-h-10 rounded-xl border bg-card px-3 text-sm" /></label>
        <label className="text-xs font-semibold text-brand-navySoft">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block min-h-10 rounded-xl border bg-card px-3 text-sm" /></label>
        <p className="text-xs text-brand-navySoft">App filter: use the switcher at the bottom of the sidebar.</p>
        <Button variant="outline" className="ml-auto" onClick={() => csv(`analytics_${from}_${to}.csv`, (data?.posts ?? []).map((p) => ({ posted_on: p.posted_on, creator: (p.creators as { full_name?: string } | null)?.full_name, brief: (p.briefs as { title?: string } | null)?.title, platform: p.platform, format: p.format, views: p.views, status: p.status })))}>Export CSV</Button>
      </div>
      {!v ? <p className="text-sm text-brand-navySoft">Loading…</p> : <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {[["Views", compact(v.totalViews)], ["Posts", String(v.series.reduce((a, s) => a + s.posts, 0))], ["Approved", String(v.approved)], ["Posting creators", String(v.creators)], ["/go clicks", compact(v.clicks)], ["Installs", compact(v.installs)]].map(([k, x]) => (
            <div key={k} className={card}><p className="text-xs text-brand-navySoft">{k}</p><p className="text-2xl font-extrabold text-brand-navy">{x}</p></div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={card}><h3 className="mb-2 font-extrabold text-brand-navy">Views by day</h3><div className="h-56"><ResponsiveContainer><LineChart data={v.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} tickFormatter={(n) => compact(Number(n))} /><Tooltip /><Line dataKey="views" stroke="hsl(var(--portal-accent, 217 91% 53%))" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
          <div className={card}><h3 className="mb-2 font-extrabold text-brand-navy">Posts by day</h3><div className="h-56"><ResponsiveContainer><BarChart data={v.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="posts" fill="hsl(var(--portal-accent, 217 91% 53%))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Breakdown title="By creator" rows={v.byCreator} /><Breakdown title="By brief" rows={v.byBrief} /><Breakdown title="By platform" rows={v.byPlatform} /><Breakdown title="By format" rows={v.byFormat} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <h3 className="font-extrabold text-brand-navy">Creator funnel</h3>
            <ul className="mt-3 space-y-2">{v.funnel.map(([k, n], i) => (
              <li key={k}><div className="flex justify-between text-sm"><span>{k}</span><b>{n}</b></div><div className="mt-1 h-2 rounded-full bg-brand-line"><div className="h-2 rounded-full bg-portal-accent" style={{ width: `${v.funnel[0][1] ? (Number(n) / Number(v.funnel[0][1])) * 100 : 0}%`, opacity: 1 - i * 0.12 }} /></div></li>
            ))}</ul>
          </div>
          <div className={card}>
            <h3 className="font-extrabold text-brand-navy">Cost</h3>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div><p className="text-xl font-extrabold text-brand-navy">{eur(v.spend)}</p><p className="text-xs text-brand-navySoft">Spend (payouts + ads)</p></div>
              <div><p className="text-xl font-extrabold text-brand-navy">{v.totalViews ? eur((v.spend / v.totalViews) * 1000) : "—"}</p><p className="text-xs text-brand-navySoft">Per 1,000 views</p></div>
              <div><p className="text-xl font-extrabold text-brand-navy">{v.installs ? eur(v.spend / v.installs) : "—"}</p><p className="text-xs text-brand-navySoft">Cost per install</p></div>
            </div>
            <p className="mt-4 text-xs text-brand-navySoft">Weekly installs per handle (from the App Store / Play campaign reports, tagged by /go links):</p>
            <InstallsForm appId={appId} />
          </div>
        </div>
      </>}
    </div>
  );
}
