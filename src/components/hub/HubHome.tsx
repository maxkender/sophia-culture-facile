import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Megaphone, Settings2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminApp, useApps } from "@/lib/apps";
import { compact, eur, useSetupChecklist, usePerformance, useWallet } from "./hub-data";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const SERIES = [
  { key: "views", label: "Views", color: "#2563EB" },
  { key: "engagement", label: "Engagement", color: "#1B3054" },
  { key: "likes", label: "Likes", color: "#16A34A" },
  { key: "comments", label: "Comments", color: "#D97706" },
  { key: "shares", label: "Shares", color: "#DB2777" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

function GetStarted() {
  const steps = useSetupChecklist();
  const done = steps.filter((s) => s.done).length;
  const current = steps.findIndex((s) => !s.done);
  return (
    <section className={card}>
      <div className="flex items-center justify-between"><h2 className="font-extrabold text-brand-navy">Get started</h2><span className="text-sm text-brand-navySoft">{done} of 5 complete</span></div>
      <div className="mt-3 h-2 rounded-full bg-portal-bg"><div className="h-2 rounded-full bg-portal-accent transition-all" style={{ width: `${done * 20}%` }} /></div>
      <ol className="mt-4 divide-y divide-brand-line">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-center gap-3 py-3">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", s.done ? "bg-portal-green text-card" : "bg-portal-bg text-brand-navy")}>{s.done ? <Check className="size-4" /> : i + 1}</span>
            <span className="min-w-0 flex-1"><span className={cn("block text-sm font-bold text-brand-navy", s.done && "line-through opacity-60")}>{s.title}</span><span className="block text-xs text-brand-navySoft">{s.subtitle}</span></span>
            {i === current ? <Button asChild size="sm"><Link to={s.to}>Continue</Link></Button> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Performance() {
  const [days, setDays] = useState(30);
  const [on, setOn] = useState<SeriesKey[]>(["views"]);
  const { data } = usePerformance(days);
  const total = (rows: typeof data extends undefined ? never : NonNullable<typeof data>["cur"] | undefined, k: SeriesKey) => (rows ?? []).reduce((a, r) => a + r[k], 0);
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold text-brand-navy">Performance</h2>
        <div className="flex items-center gap-2">
          <select aria-label="Date range" value={days} onChange={(e) => setDays(Number(e.target.value))} className="min-h-9 rounded-lg border border-brand-line bg-card px-2 text-sm">
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
          <Link to="/hub/analytics" className="text-sm font-semibold text-portal-accent">View All →</Link>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SERIES.map((s) => {
          const cur = total(data?.cur, s.key), prev = total(data?.prev, s.key);
          const delta = prev ? ((cur - prev) / prev) * 100 : cur ? 100 : 0;
          return (
            <div key={s.key} className="rounded-xl bg-portal-bg p-3">
              <p className="text-xs font-semibold text-brand-navySoft">{s.label}</p>
              <p className="mt-1 text-xl font-extrabold text-brand-navy">{compact(cur)}</p>
              <p className={cn("text-xs font-bold", delta >= 0 ? "text-portal-green" : "text-portal-red")}>{delta >= 0 ? "+" : ""}{delta.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SERIES.map((s) => (
          <button key={s.key} type="button" aria-pressed={on.includes(s.key)} onClick={() => setOn((o) => (o.includes(s.key) ? o.filter((x) => x !== s.key) : [...o, s.key]))}
            className={cn("min-h-8 rounded-full border px-3 text-xs font-bold", on.includes(s.key) ? "border-transparent text-card" : "border-brand-line text-brand-navy")}
            style={on.includes(s.key) ? { background: s.color } : undefined}>{s.label}</button>
        ))}
      </div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data?.cur ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => compact(v)} width={40} />
            <Tooltip />
            {SERIES.filter((s) => on.includes(s.key)).map((s) => <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} dot={false} strokeWidth={2} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {!data?.cur.some((d) => d.views) ? <p className="text-center text-xs text-brand-navySoft">Daily snapshots appear once the post sync runs.</p> : null}
    </section>
  );
}

function Wallet() {
  const { data } = useWallet();
  const { data: apps = [] } = useApps();
  const { appId } = useAdminApp();
  const app = apps.find((a) => a.id === appId);
  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-navy to-portal-accent p-5 text-card shadow-portal">
      <p className="text-xs font-bold uppercase opacity-80">{app?.name ?? "All apps"} · EUR</p>
      <p className="mt-3 text-xs opacity-80">Available balance</p>
      <p className="text-3xl font-extrabold">{eur(data?.available ?? 0)}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="opacity-80">Currently owed</dt><dd className="font-bold">{eur(data?.currentlyOwed ?? 0)}</dd></div>
        <div><dt className="opacity-80">Pending balance</dt><dd className="font-bold">{eur(data?.pending ?? 0)}</dd></div>
      </dl>
      <Button asChild variant="secondary" size="sm" className="mt-4 w-full"><Link to="/hub/payouts">Add Funds</Link></Button>
    </section>
  );
}

function NeedsAttention() {
  const { appId } = useAdminApp();
  const { data = [] } = useQuery({
    queryKey: ["hub", "attention", appId],
    queryFn: async () => {
      const c = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
      const since = new Date(Date.now() - 72 * 3600_000).toISOString();
      const [ugc, slide, jobs, posts, active, recent] = await Promise.all([
        c(supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("slideshow_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("creator_posts").select("id", { count: "exact", head: true }).eq("status", "pending")),
        supabase.from("creators").select("id").not("onboarding_completed_at", "is", null).eq("status", "active"),
        supabase.from("creator_posts").select("creator_id").gte("created_at", since),
      ]);
      const posted = new Set((recent.data ?? []).map((r) => r.creator_id));
      const quiet = (active.data ?? []).filter((r) => !posted.has(r.id)).length;
      return [
        { n: ugc + slide + jobs, label: "pending applications", to: "/hub/campaigns" },
        { n: posts, label: "posts to review", to: "/hub/campaigns" },
        { n: quiet, label: "creators with no post in 72h", to: "/hub/discover" },
      ].filter((x) => x.n > 0);
    },
  });
  return (
    <section className={card}>
      <h2 className="font-extrabold text-brand-navy">Needs attention</h2>
      {data.length === 0 ? <p className="mt-3 text-sm text-brand-navySoft">Nothing needs attention right now</p> : (
        <ul className="mt-3 space-y-2">{data.map((x) => (
          <li key={x.label}><Link to={x.to} search={(x.label.includes("review") ? { tab: "reviews" } : x.label.includes("applications") ? { tab: "applicants" } : {}) as never} className="flex items-center gap-3 rounded-xl bg-portal-bg px-3 py-2.5 text-sm"><b className="text-lg text-brand-navy">{x.n}</b><span className="flex-1 text-brand-navy">{x.label}</span><ArrowRight className="size-4" /></Link></li>
        ))}</ul>
      )}
    </section>
  );
}

function RecentActivity() {
  const { data = [] } = useQuery({
    queryKey: ["hub", "activity"],
    queryFn: async () => {
      const [a, p] = await Promise.all([
        supabase.from("creator_applications").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("creator_posts").select("id, platform, created_at, creators(full_name)").order("created_at", { ascending: false }).limit(5),
      ]);
      return [
        ...(a.data ?? []).map((r) => ({ id: r.id, text: `${r.full_name} applied`, at: r.created_at })),
        ...(p.data ?? []).map((r) => ({ id: r.id, text: `${(r.creators as { full_name?: string } | null)?.full_name ?? "A creator"} logged a ${r.platform ?? ""} post`, at: r.created_at })),
      ].sort((x, y) => y.at.localeCompare(x.at)).slice(0, 6);
    },
  });
  return (
    <section className={card}>
      <h2 className="font-extrabold text-brand-navy">Recent activity</h2>
      {data.length === 0 ? <p className="mt-3 text-sm text-brand-navySoft">No activity yet.</p> : (
        <ul className="mt-3 space-y-2 text-sm">{data.map((r) => <li key={r.id} className="flex justify-between gap-2"><span className="text-brand-navy">{r.text}</span><span className="shrink-0 text-xs text-brand-navySoft">{new Date(r.at).toLocaleDateString()}</span></li>)}</ul>
      )}
    </section>
  );
}

function TopContent() {
  const { appId } = useAdminApp();
  const { data = [] } = useQuery({
    queryKey: ["hub", "top", appId],
    queryFn: async () => {
      let q = supabase.from("creator_posts").select("id, url, views, platform, creators(full_name)").eq("status", "approved").order("views", { ascending: false, nullsFirst: false }).limit(6);
      if (appId) q = q.eq("app_id", appId);
      return (await q).data ?? [];
    },
  });
  return (
    <section className={card}>
      <h2 className="font-extrabold text-brand-navy">Top content</h2>
      {data.length === 0 ? <p className="mt-3 text-sm text-brand-navySoft">Approved posts will show here.</p> : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="flex aspect-[9/12] flex-col justify-end rounded-xl bg-gradient-to-b from-brand-navy/20 to-brand-navy p-3 text-card">
              <span className="text-lg font-extrabold">{compact(Number(p.views ?? 0))} views</span>
              <span className="truncate text-xs">{(p.creators as { full_name?: string } | null)?.full_name} · {p.platform}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function MessagesCard() {
  const { data = [] } = useQuery({
    queryKey: ["hub", "last-msgs"],
    queryFn: async () => {
      const { data } = await supabase.from("creator_messages").select("id, creator_id, body, created_at, from_admin, read_at, creators(full_name)").order("created_at", { ascending: false }).limit(50);
      const seen = new Set<string>();
      return (data ?? []).filter((m) => (seen.has(m.creator_id) ? false : (seen.add(m.creator_id), true))).slice(0, 5);
    },
  });
  return (
    <section className={card}>
      <div className="flex justify-between"><h2 className="font-extrabold text-brand-navy">Messages</h2><Link to="/hub/messages" className="text-sm font-semibold text-portal-accent">Open →</Link></div>
      {data.length === 0 ? <p className="mt-3 text-sm text-brand-navySoft">No conversations yet.</p> : (
        <ul className="mt-3 divide-y divide-brand-line">{data.map((m) => (
          <li key={m.id} className="py-2.5 text-sm"><p className="font-bold text-brand-navy">{(m.creators as { full_name?: string } | null)?.full_name}{!m.from_admin && !m.read_at ? <span className="ml-2 inline-block size-2 rounded-full bg-portal-accent" /> : null}</p><p className="truncate text-brand-navySoft">{m.body}</p></li>
        ))}</ul>
      )}
    </section>
  );
}

export function HubHome() {
  const [widgets, setWidgets] = useState({ performance: true, top: true, messages: true });
  const [customize, setCustomize] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setCustomize((c) => !c)}><Settings2 className="size-4" /> Customize</Button>
      </div>
      {customize ? (
        <div className="flex flex-wrap gap-4 rounded-2xl bg-card p-4 text-sm shadow-portal">
          {(Object.keys(widgets) as (keyof typeof widgets)[]).map((k) => (
            <label key={k} className="flex items-center gap-2 capitalize"><input type="checkbox" checked={widgets[k]} onChange={() => setWidgets((w) => ({ ...w, [k]: !w[k] }))} />{k}</label>
          ))}
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <GetStarted />
          {widgets.performance ? <Performance /> : null}
        </div>
        <div className="space-y-5">
          <Wallet />
          <NeedsAttention />
          <RecentActivity />
          <section className="rounded-2xl border border-portal-accent/30 bg-portal-accent/5 p-5">
            <Megaphone className="size-5 text-portal-accent" />
            <p className="mt-2 font-extrabold text-brand-navy">Turn creator posts into ads</p>
            <p className="mt-1 text-sm text-brand-navySoft">Boost your best creator videos on Meta and TikTok from one place</p>
            <Link to="/hub/ads" className="mt-3 inline-block text-sm font-bold text-portal-accent">Open Ads →</Link>
          </section>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {widgets.top ? <TopContent /> : null}
        {widgets.messages ? <MessagesCard /> : null}
      </div>
    </div>
  );
}
