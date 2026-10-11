import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Megaphone, Settings2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminApp, useApps } from "@/lib/apps";
import { PostThumb } from "./PostThumb";
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
      <div className="flex items-center justify-between"><h2 className="font-extrabold text-brand-navy">Get started</h2><span className="text-sm text-brand-navySoft">{done} of 5 done</span></div>
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
          <Link to="/hub/ugc/analytics" className="text-sm font-semibold text-portal-accent">View All →</Link>
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
      <Button asChild variant="secondary" size="sm" className="mt-4 w-full"><Link to="/hub/ugc/payouts">Open payouts</Link></Button>
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
      const [ugc, jobs, posts, active, recent] = await Promise.all([
        c(supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("creator_posts").select("id", { count: "exact", head: true }).eq("status", "pending")),
        supabase.from("creators").select("id").not("onboarding_completed_at", "is", null).eq("status", "active"),
        supabase.from("creator_posts").select("creator_id").gte("created_at", since),
      ]);
      const posted = new Set((recent.data ?? []).map((r) => r.creator_id));
      const quiet = (active.data ?? []).filter((r) => !posted.has(r.id)).length;
      return [
        { n: ugc + jobs, label: "pending applications", to: "/hub/ugc/campaigns" },
        { n: posts, label: "posts to review", to: "/hub/ugc/campaigns" },
        { n: quiet, label: "creators with no post in 72h", to: "/hub/ugc/creators" },
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
        ...(p.data ?? []).map((r) => ({ id: r.id, text: `${(r.creators as { full_name?: string } | null)?.full_name ?? "A deleted creator"} logged a ${r.platform ?? ""} post`, at: r.created_at })),
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
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="relative flex aspect-[9/12] flex-col justify-end overflow-hidden rounded-xl bg-brand-navy p-3 text-card">
              <PostThumb url={p.url} className="absolute inset-0 size-full opacity-80" />
              <span className="relative text-lg font-extrabold">{compact(Number(p.views ?? 0))} views</span>
              <span className="relative truncate text-xs">{(p.creators as { full_name?: string } | null)?.full_name} · {p.platform}</span>
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
      <div className="flex justify-between"><h2 className="font-extrabold text-brand-navy">Messages</h2><Link to="/hub/ugc/messages" className="text-sm font-semibold text-portal-accent">Open →</Link></div>
      {data.length === 0 ? <p className="mt-3 text-sm text-brand-navySoft">No conversations yet.</p> : (
        <ul className="mt-3 divide-y divide-brand-line">{data.map((m) => (
          <li key={m.id} className="py-2.5 text-sm"><p className="font-bold text-brand-navy">{(m.creators as { full_name?: string } | null)?.full_name}{!m.from_admin && !m.read_at ? <span className="ml-2 inline-block size-2 rounded-full bg-portal-accent" /> : null}</p><p className="truncate text-brand-navySoft">{m.body}</p></li>
        ))}</ul>
      )}
    </section>
  );
}

function Block({ title, rows, to, search, cta }: { title: string; rows: [string, string | number][]; to: string; search?: Record<string, string>; cta: string }) {
  return (
    <section className={card} data-testid="home-block">
      <h2 className="font-extrabold text-brand-navy">{title}</h2>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">{rows.map(([k, v]) => <div key={k}><dt className="text-xs text-brand-navySoft">{k}</dt><dd className="text-2xl font-extrabold text-brand-navy">{v}</dd></div>)}</dl>
      <Button asChild size="sm" className="mt-4"><Link to={to} search={search as never}>{cta} <ArrowRight className="size-4" /></Link></Button>
    </section>
  );
}

/** UGC Home: KPI strip, the four blocks and the setup checklist — nothing else. */
export function HubHome() {
  const { appId } = useAdminApp();
  const { data } = useQuery({
    queryKey: ["hub", "ugc-home-blocks", appId],
    queryFn: async () => {
      const c = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
      const scope = <T extends { eq: (k: string, v: string) => T }>(q: T) => (appId ? q.eq("app_id", appId) : q);
      const [pub, drafts, active, onboarding, apps, toValidate, ready] = await Promise.all([
        c(scope(supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "published") as never)),
        c(scope(supabase.from("briefs").select("id", { count: "exact", head: true }).eq("status", "draft") as never)),
        c(supabase.from("creators").select("id", { count: "exact", head: true }).eq("track", "ugc").not("onboarding_completed_at", "is", null)),
        c(supabase.from("creators").select("id", { count: "exact", head: true }).eq("track", "ugc").is("onboarding_completed_at", null)),
        c(supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(scope(supabase.from("creator_posts").select("id", { count: "exact", head: true }).eq("status", "pending") as never)),
        scope(supabase.from("creator_posts").select("pay_amount").eq("pay_status", "ready") as never) as unknown as Promise<{ data: { pay_amount: number }[] | null }>,
      ]);
      return { pub, drafts, active, onboarding, apps, toValidate, ready: (ready.data ?? []).reduce((s, r) => s + Number(r.pay_amount ?? 0), 0), readyN: (ready.data ?? []).length };
    },
  });
  return (
    <div className="space-y-5">
      <Performance />
      <div className="grid gap-5 md:grid-cols-2">
        <Block title="Briefs" rows={[["Published", data?.pub ?? "…"], ["Drafts", data?.drafts ?? "…"]]} to="/hub/ugc/library" search={{ tab: "Briefs" }} cta="Open briefs" />
        <Block title="Creators" rows={[["Active", data?.active ?? "…"], ["Onboarding", data?.onboarding ?? "…"], ["Applications", data?.apps ?? "…"]]} to="/hub/ugc/creators" cta="Open creators" />
        <Block title="Posts to validate" rows={[["Waiting", data?.toValidate ?? "…"]]} to="/hub/ugc/campaigns" search={{ tab: "reviews" }} cta="Validate posts" />
        <Block title="Ready for payment" rows={[["Amount", eur(data?.ready ?? 0)], ["Posts", data?.readyN ?? "…"]]} to="/hub/ugc/payouts" cta="Open payouts" />
      </div>
      <GetStarted />
    </div>
  );
}
