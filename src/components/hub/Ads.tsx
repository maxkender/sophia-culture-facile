import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, Download, ExternalLink, Pause, Play, Rocket, Square } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp, useApps } from "@/lib/apps";
import { adFileUrl, adsConnectionStatus, markAdWinner, pushAd, requestCreatorTask, saveAdCandidate, setAdStatus, syncAdMetricsNow } from "@/lib/hub.functions";
import { PostThumb } from "./PostThumb";
import { compact, eur } from "./hub-data";

type Tab = "candidates" | "queue" | "live" | "results" | "connections";
const TABS: [Tab, string][] = [["candidates", "Candidates"], ["queue", "Queue"], ["live", "Live"], ["results", "Results"], ["connections", "Connections"]];
const card = "rounded-2xl bg-card p-5 shadow-portal";
const input = "mt-1 block min-h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";

type Ad = {
  id: string; post_id: string; app_id: string; creator_id: string | null; status: string; channel: "tiktok" | "meta"; objective: string; daily_budget: number | null; duration_days: number | null;
  country: string; cta: string; landing_url: string | null; notes: string | null; caption: string | null; hook: string | null; spark_code: string | null; spark_valid_until: string | null;
  raw_file_path: string | null; external_ids: Record<string, string>; winner: boolean; started_at: string | null; created_at: string;
  creator_posts: { url: string; platform: string | null; views: number | null; likes: number | null; creators: { full_name: string; tiktok_handle: string | null; instagram_handle: string | null } | null } | null;
  ad_metrics_daily: { day: string; spend: number; impressions: number; clicks: number; installs: number }[];
  creator_tasks: { type: string; status: string }[];
};

function useAds() {
  const { appId } = useAdminApp();
  return useQuery({
    queryKey: ["hub", "ads", appId],
    queryFn: async () => {
      let q = supabase.from("ad_candidates").select("*, creator_posts(url, platform, views, likes, creators(full_name, tiktok_handle, instagram_handle)), ad_metrics_daily(day, spend, impressions, clicks, installs), creator_tasks(type, status)").order("created_at", { ascending: false });
      if (appId) q = q.eq("app_id", appId);
      return ((await q).data ?? []) as unknown as Ad[];
    },
  });
}
const totals = (ad: Ad) => ad.ad_metrics_daily.reduce((t, m) => ({ spend: t.spend + Number(m.spend), impressions: t.impressions + Number(m.impressions), clicks: t.clicks + Number(m.clicks), installs: t.installs + Number(m.installs) }), { spend: 0, impressions: 0, clicks: 0, installs: 0 });

function Candidates({ onPromoted }: { onPromoted: (id: string) => void }) {
  const { appId } = useAdminApp();
  const [platform, setPlatform] = useState("");
  const [since, setSince] = useState(30);
  const qc = useQueryClient();
  const { data: ads = [] } = useAds();
  const { data = [] } = useQuery({
    queryKey: ["hub", "ad-cands", appId, since],
    queryFn: async () => {
      let q = supabase.from("creator_posts").select("id, url, platform, views, likes, posted_on, app_id, creator_id, brief_id, creators(full_name, track), briefs(title)").eq("status", "approved").gte("created_at", new Date(Date.now() - since * 86400_000).toISOString()).limit(300);
      if (appId) q = q.eq("app_id", appId);
      const posts = (await q).data ?? [];
      const ids = posts.map((p) => p.id);
      const { data: m } = ids.length ? await supabase.from("post_metrics_daily").select("post_id, day, views, likes, comments, shares").in("post_id", ids).order("day") : { data: [] };
      return posts.map((p) => {
        const series = (m ?? []).filter((x) => x.post_id === p.id);
        const last = series.at(-1);
        const views = Number(last?.views ?? p.views ?? 0);
        const eng = Number(last ? last.likes + last.comments + last.shares : p.likes ?? 0);
        const er = views ? eng / views : 0;
        return { ...p, views, likes: Number(last?.likes ?? p.likes ?? 0), comments: Number(last?.comments ?? 0), shares: Number(last?.shares ?? 0), er, series: series.slice(-7).map((x) => Number(x.views)), score: views * er };
      }).sort((a, b) => b.score - a.score);
    },
  });
  const promoted = new Set(ads.map((a) => a.post_id));
  async function promote(p: (typeof data)[number]) {
    const { data: row, error } = await supabase.from("ad_candidates").insert({ post_id: p.id, app_id: p.app_id ?? appId ?? SOPHIA_APP_ID, creator_id: p.creator_id, status: "queued", channel: p.platform === "instagram" ? "meta" : "tiktok", hook: (p.briefs as { title?: string } | null)?.title ?? null }).select("id").single();
    if (error) { toast.error("Could not add the post to the queue."); return; }
    void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); onPromoted(row.id);
  }
  const rows = data.filter((p) => !platform || p.platform === platform);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <select aria-label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="min-h-9 rounded-lg border bg-card px-2 text-sm"><option value="">All platforms</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select>
        <select aria-label="Period" value={since} onChange={(e) => setSince(Number(e.target.value))} className="min-h-9 rounded-lg border bg-card px-2 text-sm"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
      </div>
      {rows.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No approved posts in this period yet.</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const max = Math.max(1, ...p.series);
            return (
              <article key={p.id} className="overflow-hidden rounded-2xl bg-card shadow-portal">
                <PostThumb url={p.url} className="h-44 w-full" />
                <div className="space-y-2 p-4">
                  <p className="font-bold text-brand-navy">{(p.creators as { full_name?: string } | null)?.full_name} · <span className="capitalize">{p.platform}</span></p>
                  <p className="text-xs text-brand-navySoft">{(p.briefs as { title?: string } | null)?.title ?? "No brief"} · {p.posted_on}</p>
                  <div className="grid grid-cols-4 text-center text-xs">{[["Views", p.views], ["Likes", p.likes], ["Comments", p.comments], ["Shares", p.shares]].map(([k, v]) => <div key={k as string}><b className="block text-sm text-brand-navy">{compact(Number(v))}</b>{k}</div>)}</div>
                  <div className="flex h-8 items-end gap-0.5" aria-label="7-day growth">{p.series.length ? p.series.map((v, i) => <span key={i} className="flex-1 rounded-sm bg-portal-accent/60" style={{ height: `${(v / max) * 100}%` }} />) : <span className="text-[10px] text-brand-navySoft">No daily data yet</span>}</div>
                  <p className="text-xs text-portal-green">Ads rights: included (creator account agreement)</p>
                  <Button size="sm" className="w-full" disabled={promoted.has(p.id)} onClick={() => void promote(p)}><Rocket className="size-4" />{promoted.has(p.id) ? "Already in Ads" : "Promote"}</Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function AdPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: ads = [] } = useAds();
  const { data: apps = [] } = useApps();
  const ad = ads.find((a) => a.id === id);
  const qc = useQueryClient();
  const save = useServerFn(saveAdCandidate);
  const task = useServerFn(requestCreatorTask);
  const push = useServerFn(pushAd);
  const fileUrl = useServerFn(adFileUrl);
  const [draft, setDraft] = useState<Partial<Ad>>({});
  if (!ad) return null;
  const v = { ...ad, ...draft };
  const app = apps.find((a) => a.id === ad.app_id);
  const store = v.channel === "meta" ? app?.play_store_url || app?.app_store_url : app?.app_store_url || app?.play_store_url;
  const defaultLanding = store ? `${store}${store.includes("?") ? "&" : "?"}${store.includes("apple.com") ? "ct" : "utm_campaign"}=ad-${ad.id.slice(0, 8)}` : "";
  const field = (k: keyof Ad) => ({ value: (v[k] as string | number | null) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [k]: e.target.value })) });
  const handle = v.channel === "tiktok" ? ad.creator_posts?.creators?.tiktok_handle : ad.creator_posts?.creators?.instagram_handle;
  async function persist() {
    const patch = { ...draft, daily_budget: draft.daily_budget ? Number(draft.daily_budget) : draft.daily_budget, duration_days: draft.duration_days ? Number(draft.duration_days) : draft.duration_days, landing_url: v.landing_url || defaultLanding || null };
    await save({ data: { id: ad!.id, patch } }); setDraft({}); toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "ads"] });
  }
  async function uploadRaw(f: File) {
    const path = `${ad!.creator_id ?? "admin"}/ads/${ad!.id}-${Date.now()}.mp4`;
    const { error } = await supabase.storage.from("creator-videos").upload(path, f, { contentType: f.type || "video/mp4" });
    if (error) { toast.error("Upload failed. Please try again."); return; }
    await save({ data: { id: ad!.id, patch: { raw_file_path: path } } }); toast.success("Video uploaded"); void qc.invalidateQueries({ queryKey: ["hub", "ads"] });
  }
  const openTask = (t: string) => ad.creator_tasks.some((x) => x.type === t && x.status === "open");
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-card sm:max-w-xl">
        <SheetTitle className="text-lg font-extrabold text-brand-navy">Ad pack</SheetTitle>
        <div className="mt-4 space-y-5">
          <div className="flex gap-3"><PostThumb url={ad.creator_posts?.url} className="h-32 w-24 shrink-0 rounded-xl" />
            <div className="min-w-0 text-sm"><p className="font-bold text-brand-navy">{ad.creator_posts?.creators?.full_name}</p><p className="text-brand-navySoft">Account @{handle ?? "—"}</p><a href={ad.creator_posts?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-portal-accent">Open post <ExternalLink className="size-3" /></a>
              <p className={cn("mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold", ad.status === "ready" ? "bg-portal-green/15 text-portal-green" : "bg-portal-bg text-brand-navy")}>{ad.status}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Channel<select className={input} {...field("channel")}><option value="tiktok">TikTok Spark Ads</option><option value="meta">Meta (Reels / Stories)</option></select></label>
            <label className="text-sm font-semibold">Objective<select className={input} {...field("objective")}><option value="app_installs">App installs</option><option value="traffic">Traffic</option></select></label>
            <label className="text-sm font-semibold">Daily budget (€)<input type="number" min={1} className={input} {...field("daily_budget")} /></label>
            <label className="text-sm font-semibold">Duration (days)<input type="number" min={1} className={input} {...field("duration_days")} /></label>
            <label className="text-sm font-semibold">Country<input maxLength={2} className={input} {...field("country")} /></label>
            <label className="text-sm font-semibold">Call to action<input className={input} {...field("cta")} /></label>
          </div>
          <label className="block text-sm font-semibold">Landing link<input className={input} {...field("landing_url")} placeholder={defaultLanding || "Add store links in Apps settings"} /><span className="text-xs font-normal text-brand-navySoft">Tracking tag per ad is added automatically.</span></label>
          <label className="block text-sm font-semibold">Hook<input className={input} {...field("hook")} /></label>
          <label className="block text-sm font-semibold">Caption<textarea className={`${input} min-h-16 py-2`} {...field("caption")} /></label>
          <label className="block text-sm font-semibold">Notes<textarea className={`${input} min-h-16 py-2`} {...field("notes")} /></label>

          {v.channel === "tiktok" ? (
            <section className="rounded-xl border border-brand-line p-4 text-sm">
              <p className="font-bold text-brand-navy">Spark authorization code</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-brand-navySoft"><li>Sign in to @{handle ?? "the account"} on TikTok (credentials: open the creator's profile → Accounts → Reveal).</li><li>Open the video → ⋯ → Ad settings → turn on Ad authorization.</li><li>Generate a code (60 days) and paste it below.</li></ol>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px]"><input aria-label="Spark authorization code" className={input} {...field("spark_code")} placeholder="#AbC123…" /><input aria-label="Valid until" type="date" className={input} {...field("spark_valid_until")} /></div>
              <Button size="sm" variant="outline" className="mt-2" disabled={openTask("spark_code")} onClick={async () => { await task({ data: { adId: ad.id, type: "spark_code" } }); toast.success("Task sent to the creator"); void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); }}>{openTask("spark_code") ? "Asked — waiting" : "Ask the creator"}</Button>
            </section>
          ) : (
            <section className="rounded-xl border border-brand-line p-4 text-sm">
              <p className="font-bold text-brand-navy">Original video file</p>
              <p className="text-brand-navySoft">MP4, at least 1080p, no watermark.</p>
              {ad.raw_file_path ? <Button size="sm" variant="outline" className="mt-2" onClick={async () => { const r = await fileUrl({ data: { path: ad.raw_file_path! } }); if (r.url) window.open(r.url, "_blank"); }}><Download className="size-4" />Download video</Button> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={openTask("raw_upload")} onClick={async () => { await task({ data: { adId: ad.id, type: "raw_upload" } }); toast.success("Task sent to the creator"); void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); }}>{openTask("raw_upload") ? "Requested — waiting" : "Request raw file"}</Button>
                <label className="inline-flex min-h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-semibold">Upload directly<input type="file" accept="video/mp4,video/quicktime" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadRaw(f); }} /></label>
              </div>
            </section>
          )}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button onClick={() => void persist()}>Save</Button>
            <Button variant="outline" onClick={async () => { await persist(); const r = await push({ data: { id: ad.id } }); if (r.ok) toast.success("Created in the ads platform — paused. Switch it on from Live or the ads manager."); else toast.error(r.reason); void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); }}>Push to ads (paused)</Button>
            <Button asChild variant="ghost"><a href="https://ads.tiktok.com/i18n/dashboard" target="_blank" rel="noreferrer">TikTok Ads Manager ↗</a></Button>
            <Button asChild variant="ghost"><a href="https://adsmanager.facebook.com/" target="_blank" rel="noreferrer">Meta Ads Manager ↗</a></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Queue({ open }: { open: (id: string) => void }) {
  const { data = [] } = useAds();
  const rows = data.filter((a) => a.status === "queued" || a.status === "ready");
  if (!rows.length) return <p className={cn(card, "text-sm text-brand-navySoft")}>Nothing queued. Promote a post from Candidates.</p>;
  return (
    <ul className="space-y-2">{rows.map((a) => (
      <li key={a.id}><button type="button" onClick={() => open(a.id)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-portal">
        <PostThumb url={a.creator_posts?.url} className="h-16 w-12 shrink-0 rounded-lg" />
        <span className="min-w-0 flex-1"><b className="block text-brand-navy">{a.creator_posts?.creators?.full_name}</b><span className="text-xs text-brand-navySoft">{a.channel === "tiktok" ? "TikTok Spark" : "Meta"} · {a.daily_budget ? `${eur(Number(a.daily_budget))}/day` : "no budget"} · {a.channel === "tiktok" ? (a.spark_code ? "code ✓" : "code missing") : a.raw_file_path ? "file ✓" : "file missing"}</span></span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", a.status === "ready" ? "bg-portal-green/15 text-portal-green" : "bg-portal-amber/15 text-portal-amber")}>{a.status}</span>
      </button></li>
    ))}</ul>
  );
}

function ManualMetrics({ ad }: { ad: Ad }) {
  const qc = useQueryClient();
  const [m, setM] = useState({ day: new Date().toISOString().slice(0, 10), spend: "", impressions: "", clicks: "", installs: "" });
  return (
    <form className="mt-2 flex flex-wrap gap-1" onSubmit={async (e) => { e.preventDefault(); const { error } = await supabase.from("ad_metrics_daily").upsert({ ad_id: ad.id, day: m.day, spend: Number(m.spend || 0), impressions: Number(m.impressions || 0), clicks: Number(m.clicks || 0), installs: Number(m.installs || 0), source: "manual" }, { onConflict: "ad_id,day" }); if (error) toast.error("Could not save."); else { toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); } }}>
      <input aria-label="Day" type="date" className="h-8 rounded border px-1 text-xs" value={m.day} onChange={(e) => setM({ ...m, day: e.target.value })} />
      {(["spend", "impressions", "clicks", "installs"] as const).map((k) => <input key={k} aria-label={k} placeholder={k} type="number" className="h-8 w-20 rounded border px-1 text-xs" value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })} />)}
      <Button size="sm" type="submit" variant="outline" className="h-8">Add</Button>
    </form>
  );
}

function Live({ open }: { open: (id: string) => void }) {
  const { data = [] } = useAds();
  const qc = useQueryClient();
  const status = useServerFn(setAdStatus);
  const sync = useServerFn(syncAdMetricsNow);
  const rows = data.filter((a) => ["pushed", "live", "paused"].includes(a.status));
  async function set(a: Ad, s: "live" | "paused" | "ended") { const r = await status({ data: { id: a.id, status: s } }); if (r.remote) toast(`Saved here. In the ads platform: ${r.remote}`); else toast.success("Updated"); void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); }
  return (
    <>
      <div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={async () => { const r = await sync(); toast(`${r.synced} ads updated${r.errors.length ? ` · ${r.errors[0]}` : ""}`); void qc.invalidateQueries({ queryKey: ["hub", "ads"] }); }}>Sync results now</Button></div>
      {rows.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No ads running. Mark an ad as live once it is switched on, or push one from the Queue.</p> : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-brand-navySoft"><tr><th className="p-3">Creator</th><th>Channel</th><th>Status</th><th>Spend</th><th>Impr.</th><th>Clicks</th><th>Installs</th><th>CPI</th><th>Start</th><th /></tr></thead>
            <tbody className="divide-y divide-brand-line">{rows.map((a) => { const t = totals(a); return (
              <tr key={a.id} className="align-top">
                <td className="p-3"><button type="button" className="font-bold text-brand-navy underline-offset-2 hover:underline" onClick={() => open(a.id)}>{a.creator_posts?.creators?.full_name}</button><ManualMetrics ad={a} /></td>
                <td>{a.channel}</td><td>{a.status}</td><td>{eur(t.spend)}</td><td>{compact(t.impressions)}</td><td>{compact(t.clicks)}</td><td>{t.installs}</td><td>{t.installs ? eur(t.spend / t.installs) : "—"}</td><td>{a.started_at ?? "—"}</td>
                <td className="whitespace-nowrap p-2">{a.status === "live" ? <Button size="icon" variant="ghost" aria-label="Pause" onClick={() => void set(a, "paused")}><Pause className="size-4" /></Button> : <Button size="icon" variant="ghost" aria-label="Resume" onClick={() => void set(a, "live")}><Play className="size-4" /></Button>}<Button size="icon" variant="ghost" aria-label="Mark ended" onClick={() => void set(a, "ended")}><Square className="size-4" /></Button></td>
              </tr>); })}</tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-brand-navySoft">Ads that were set up by hand in the ads manager: open the ad pack and mark it live from here once it runs.</p>
      <div className="mt-2 flex flex-wrap gap-2">{data.filter((a) => a.status === "ready").map((a) => <Button key={a.id} size="sm" variant="outline" onClick={() => void set(a, "live")}>Mark {a.creator_posts?.creators?.full_name}'s ad as live</Button>)}</div>
    </>
  );
}

function Results() {
  const { data = [] } = useAds();
  const qc = useQueryClient();
  const winner = useServerFn(markAdWinner);
  const { data: s } = useQuery({ queryKey: ["hub", "ugc-settings"], queryFn: async () => (await supabase.from("ugc_settings").select("*").eq("id", 1).maybeSingle()).data });
  const target = Number(s?.cpi_target ?? 1.5);
  const rows = data.filter((a) => a.ad_metrics_daily.length || ["live", "paused", "ended"].includes(a.status));
  if (!rows.length) return <p className={cn(card, "text-sm text-brand-navySoft")}>Results appear once ads have spend.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs text-brand-navySoft"><tr><th className="p-3">Post</th><th>Organic views</th><th>Paid impressions</th><th>Spend</th><th>Installs</th><th>CPI</th><th>Winner</th></tr></thead>
        <tbody className="divide-y divide-brand-line">{rows.map((a) => { const t = totals(a); const cpi = t.installs ? t.spend / t.installs : null; const good = cpi !== null && cpi <= target; return (
          <tr key={a.id}>
            <td className="p-3 font-bold text-brand-navy">{a.creator_posts?.creators?.full_name} · {a.channel}</td>
            <td>{compact(Number(a.creator_posts?.views ?? 0))}</td><td>{compact(t.impressions)}</td><td>{eur(t.spend)}</td><td>{t.installs}</td>
            <td className={good ? "font-bold text-portal-green" : ""}>{cpi !== null ? eur(cpi) : "—"}</td>
            <td>{a.winner ? <span className="inline-flex items-center gap-1 rounded-full bg-portal-amber/20 px-2 text-xs font-bold"><Award className="size-3" />Winner</span> : (
              <Button size="sm" variant={good ? "default" : "outline"} onClick={async () => { await winner({ data: { id: a.id, winner: true } }); toast.success("Marked winner — creator notified and bonus added"); void qc.invalidateQueries({ queryKey: ["hub"] }); }}>Mark winner</Button>
            )}</td>
          </tr>); })}</tbody>
      </table>
      <p className="p-3 text-xs text-brand-navySoft">Target CPI {eur(target)} (Payouts settings). Winners tag their brief "ad winner" and add the ad selection bonus to the creator's month.</p>
    </div>
  );
}

function Connections() {
  const { data: apps = [] } = useApps();
  const qc = useQueryClient();
  const status = useServerFn(adsConnectionStatus);
  const { data: tokens } = useQuery({ queryKey: ["hub", "ads-tokens"], queryFn: () => status() });
  const { data: conns = [] } = useQuery({ queryKey: ["hub", "ad-conns"], queryFn: async () => (await supabase.from("ad_connections").select("*")).data ?? [] });
  async function save(appId: string, channel: "meta" | "tiktok", account_id: string, config: Record<string, string>) {
    const { error } = await supabase.from("ad_connections").upsert({ app_id: appId, channel, account_id: account_id || null, config, connected_at: new Date().toISOString() }, { onConflict: "app_id,channel" });
    if (error) toast.error("Could not save."); else { toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "ad-conns"] }); }
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {apps.filter((a) => a.active).flatMap((app) => (["tiktok", "meta"] as const).map((ch) => {
        const c = conns.find((x) => x.app_id === app.id && x.channel === ch);
        const cfg = (c?.config ?? {}) as Record<string, string>;
        const hasToken = ch === "meta" ? tokens?.meta : tokens?.tiktok;
        return (
          <form key={`${app.id}-${ch}`} className={card} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const rest = Object.fromEntries([...fd.entries()].filter(([k]) => k !== "account_id").map(([k, v]) => [k, String(v)])); void save(app.id, ch, String(fd.get("account_id") ?? ""), rest); }}>
            <div className="flex items-center justify-between"><p className="font-extrabold text-brand-navy">{ch === "meta" ? "Meta Marketing API" : "TikTok Marketing API"} · {app.name}</p><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", hasToken && c?.account_id ? "bg-portal-green/15 text-portal-green" : "bg-portal-bg text-brand-navySoft")}>{hasToken && c?.account_id ? "Connected" : "Manual mode"}</span></div>
            <p className="mt-1 text-xs text-brand-navySoft">Access token: {hasToken ? "saved" : `not saved yet — add the ${ch === "meta" ? "META_ADS_TOKEN" : "TIKTOK_ADS_TOKEN"} secret`}. Without it, use the ad pack and the ads manager by hand.</p>
            <label className="mt-3 block text-sm font-semibold">{ch === "meta" ? "Ad account id" : "Advertiser id"}<input name="account_id" defaultValue={c?.account_id ?? ""} className={input} /></label>
            {ch === "meta" ? <>
              <label className="mt-2 block text-sm font-semibold">Facebook page id<input name="page_id" defaultValue={cfg["page_id"] ?? ""} className={input} /></label>
              <label className="mt-2 block text-sm font-semibold">Meta app id<input name="app_id" defaultValue={cfg["app_id"] ?? ""} className={input} /></label>
              <label className="mt-2 block text-sm font-semibold">Store link<input name="store_url" defaultValue={cfg["store_url"] ?? app.app_store_url ?? ""} className={input} /></label>
            </> : <label className="mt-2 block text-sm font-semibold">TikTok app id<input name="app_id" defaultValue={cfg["app_id"] ?? ""} className={input} /></label>}
            <Button type="submit" size="sm" className="mt-3">Save</Button>
          </form>
        );
      }))}
    </div>
  );
}

export function Ads() {
  const [tab, setTab] = useState<Tab>("candidates");
  const [panel, setPanel] = useState<string | null>(null);
  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-brand-line">
        {TABS.map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={cn("shrink-0 border-b-2 px-3 pb-2.5 text-sm font-bold", tab === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l}</button>)}
      </div>
      {tab === "candidates" ? <Candidates onPromoted={(id) => { setPanel(id); setTab("queue"); }} /> : tab === "queue" ? <Queue open={setPanel} /> : tab === "live" ? <Live open={setPanel} /> : tab === "results" ? <Results /> : <Connections />}
      <AdPanel id={panel} onClose={() => setPanel(null)} />
    </div>
  );
}
