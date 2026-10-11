import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Film, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { generateBriefsFromCourses } from "@/lib/hub-learn.functions";
import { assetUploadSlot, briefFromVideo, metaAdsPrepare, studioAi } from "@/lib/brief-studio.functions";
import { STUDIO_DRAFT_KEY } from "@/lib/brief-studio";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const sel = "h-9 rounded-lg border px-2 text-sm";
const EFF: Record<string, string> = { pov: "POV", reaction: "Réaction", talking_head: "Face cam" };
const nextMonday = () => { const d = new Date(); const add = ((8 - d.getUTCDay()) % 7) || 7; d.setUTCDate(d.getUTCDate() + add); d.setUTCHours(7, 0, 0, 0); return d.toISOString(); };

/** Grabs up to 5 frames from a local video file as JPEG data URLs (for the multimodal analysis). */
async function framesOf(file: File | string): Promise<string[]> {
  const v = document.createElement("video"); v.muted = true; v.crossOrigin = "anonymous"; v.src = typeof file === "string" ? file : URL.createObjectURL(file); v.preload = "auto";
  await new Promise((r, j) => { v.onloadedmetadata = r; v.onerror = j; });
  const out: string[] = []; const c = document.createElement("canvas"); const w = 360; c.width = w; c.height = Math.round((w * v.videoHeight) / Math.max(1, v.videoWidth));
  for (const t of [0.3, 0.15, 0.4, 0.65, 0.9].map((p, i) => (i === 0 ? 0.3 : p * v.duration))) {
    v.currentTime = Math.min(t, Math.max(0, v.duration - 0.1));
    await new Promise((r) => { v.onseeked = r; });
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height); out.push(c.toDataURL("image/jpeg", 0.7));
  }
  if (typeof file !== "string") URL.revokeObjectURL(v.src); return out;
}

function QuickBrief({ app, onClose }: { app: string; onClose: () => void }) {
  const ai = useServerFn(studioAi); const navigate = useNavigate();
  const [idea, setIdea] = useState(""); const [fmt, setFmt] = useState(""); const [busy, setBusy] = useState(false);
  const { data: formats = [] } = useQuery({ queryKey: ["hub", "learn", "fmt-pick", app], queryFn: async () => (await supabase.from("briefs").select("id, title").eq("app_id", app).eq("brief_type", "format").order("sort_order")).data ?? [] });
  return (
    <div className={cn(card, "space-y-3")}>
      <h3 className="font-extrabold text-brand-navy">Brief rapide</h3>
      <label className="block text-sm font-semibold">Le fait / l'idée<textarea rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label>
      <select aria-label="Format" value={fmt} onChange={(e) => setFmt(e.target.value)} className={cn(sel, "w-full")}><option value="">No format (free)</option>{formats.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}</select>
      <div className="flex gap-2"><Button disabled={busy || idea.trim().length < 5} onClick={async () => {
        setBusy(true);
        try { const r = await ai({ data: { mode: "quick", appId: app, idea, formatId: fmt || null } }); sessionStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify({ ...r.patch, app_id: app, parent_format_id: fmt || null })); void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: "new" } }); }
        catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
      }}><Sparkles className="size-4" />{busy ? "Writing…" : "Fill and open the Studio"}</Button><Button variant="ghost" onClick={onClose}>Cancel</Button></div>
    </div>
  );
}

function FromVideo({ app, onClose }: { app: string; onClose: () => void }) {
  const run = useServerFn(briefFromVideo); const meta = useServerFn(metaAdsPrepare); const [step, setStep] = useState(""); const slot = useServerFn(assetUploadSlot); const qc = useQueryClient();
  const [urls, setUrls] = useState(""); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ label: string; score: number; briefIds: string[]; error?: string }[]>([]);
  async function go() {
    setBusy(true); setDone([]);
    const list = urls.split(/\s+/).map((u) => u.trim()).filter((u) => /^https:\/\//.test(u)).slice(0, 20);
    if (file) {
      try {
        const frames = await framesOf(file);
        const { path, token } = await slot({ data: { appId: app, name: file.name } });
        await supabase.storage.from("creator-assets").uploadToSignedUrl(path, token, file);
        const r = await run({ data: { appId: app, frames, caption: file.name, storagePath: path } });
        setDone((d) => [...d, { label: file.name, score: r.score, briefIds: r.briefIds }]);
      } catch (e) { setDone((d) => [...d, { label: file.name, score: 0, briefIds: [], error: (e as Error).message }]); }
    }
    for (const u of list) {
      if (/facebook\.com\/ads\/library/i.test(u)) {
        try {
          setStep("Meta Ads Library – fetching the ad…");
          const { ads } = await meta({ data: { appId: app, url: u } });
          for (const x of ads) {
            setStep(x.video ? "Meta Ads Library – analysing the ad video…" : "Meta Ads Library – analysing the ad images…");
            let frames: string[] = [];
            if (x.video) { try { frames = await framesOf(x.video.signedUrl); } catch { frames = []; } }
            const r = await run({ data: { appId: app, url: u, ad: x.ad, frames, storagePath: x.video?.path ?? null } });
            setDone((d) => [...d, { label: `${x.ad.pageName || "Ad"} · ${x.ad.adId}`, score: r.score, briefIds: r.briefIds }]);
          }
        } catch (e) { setDone((d) => [...d, { label: u, score: 0, briefIds: [], error: (e as Error).message }]); }
        setStep(""); continue;
      }
      try { const r = await run({ data: { appId: app, url: u } }); setDone((d) => [...d, { label: u, score: r.score, briefIds: r.briefIds }]); }
      catch (e) { setDone((d) => [...d, { label: u, score: 0, briefIds: [], error: (e as Error).message }]); if (/credits|blocked/.test((e as Error).message)) break; }
    }
    setBusy(false); void qc.invalidateQueries({ queryKey: ["hub", "learn"] });
  }
  return (
    <div className={cn(card, "space-y-3")}>
      <h3 className="font-extrabold text-brand-navy">Brief depuis une vidéo</h3>
      <p className="text-xs text-brand-navySoft">Paste up to 20 TikTok, Instagram or Meta Ads Library links (one per line) or upload one file. Meta Ads Library ads are read with their video frame by frame (or their images and copy); a page or search link reads up to 5 ads. Each video is saved in References with its 10-line analysis and a /10 score, and 1-3 adapted draft briefs are created. Links are read from their cover and caption; upload the file for a frame-by-frame read.</p>
      <textarea aria-label="Video links" rows={4} value={urls} onChange={(e) => setUrls(e.target.value)} placeholder="https://www.tiktok.com/@…/video/…" className="w-full rounded-xl border p-3 text-sm" />
      <input type="file" accept="video/*" aria-label="Video file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <div className="flex gap-2"><Button disabled={busy || (!urls.trim() && !file)} onClick={() => void go()}><Film className="size-4" />{busy ? step || `Analysing… ${done.length}` : "Analyse"}</Button><Button variant="ghost" onClick={onClose}>Close</Button></div>
      {done.length ? <ul className="space-y-1 text-sm">{done.map((d, i) => <li key={i} className="rounded-lg bg-portal-bg p-2"><span className="break-all font-semibold">{d.label}</span> — {d.error ? <span className="text-portal-red">{d.error}</span> : <>score {d.score}/10 · {d.briefIds.map((id, j) => <Link key={id} to="/hub/ugc/library/briefs/$briefId" params={{ briefId: id }} className="ml-1 font-bold text-portal-accent">brief {j + 1}</Link>)}</>}</li>)}</ul> : null}
    </div>
  );
}

type Row = { id: string; title: string; hook_text: string | null; hook: string | null; brief_type: string; effort: string | null; status: string; audience: string; audience_efforts: string[]; score: number | null; drop_at: string | null; language: string; created_at: string };

export function BriefsList() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient();
  const gen = useServerFn(generateBriefsFromCourses);
  const [panel, setPanel] = useState<"none" | "quick" | "video">("none");
  const [n, setN] = useState(3);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [f, setF] = useState({ type: "all", effort: "all", status: "all", audience: "all" });
  const [assignTo, setAssignTo] = useState("");
  const { data } = useQuery({
    queryKey: ["hub", "learn", "briefs", app],
    queryFn: async () => {
      const [b, p, a, c] = await Promise.all([
        supabase.from("briefs").select("id, title, hook_text, hook, brief_type, effort, status, audience, audience_efforts, score, drop_at, language, created_at").eq("app_id", app).neq("brief_type", "format").order("created_at", { ascending: false }).limit(500),
        supabase.from("creator_posts").select("brief_id, views, posted_on").eq("app_id", app).not("brief_id", "is", null),
        supabase.from("brief_assets").select("brief_id"),
        supabase.from("creators").select("id, full_name, creator_apps!inner(app_id)").eq("creator_apps.app_id", app).order("full_name").limit(500),
      ]);
      const stats: Record<string, { posts: number; v7: number[]; assets: number }> = {};
      const s = (id: string) => (stats[id] ??= { posts: 0, v7: [], assets: 0 });
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
      for (const r of p.data ?? []) { const x = s(r.brief_id!); x.posts++; if (r.posted_on && r.posted_on <= weekAgo) x.v7.push(Number(r.views ?? 0)); }
      for (const r of a.data ?? []) s(r.brief_id).assets++;
      return { rows: (b.data ?? []) as unknown as Row[], stats, creators: c.data ?? [] };
    },
  });
  const rows = useMemo(() => (data?.rows ?? []).filter((r) =>
    (f.type === "all" || (f.type === "variant" ? false : r.brief_type === f.type)) && (f.effort === "all" || r.effort === f.effort) && (f.status === "all" || r.status === f.status)
    && (f.audience === "all" || (f.audience === "effort" ? r.audience_efforts?.length : r.audience === f.audience && !r.audience_efforts?.length))), [data, f]);
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "learn"] });
  async function bulk(patch: Record<string, unknown>, label: string) {
    const low = (data?.rows ?? []).filter((r) => picked.includes(r.id) && patch["status"] === "published" && (r.score ?? 0) < 8);
    if (low.length && !window.confirm(`${low.length} selected brief(s) score under 8/10. Publish anyway?`)) return;
    const { error } = await supabase.from("briefs").update(patch as never).in("id", picked);
    if (error) toast.error("Could not update."); else { toast.success(`${picked.length} ${label}`); setPicked([]); reload(); }
  }
  async function bulkAssign() {
    if (!assignTo) return;
    const { error } = await supabase.from("brief_assignments").insert(picked.map((id) => ({ brief_id: id, creator_id: assignTo, published_at: new Date().toISOString() })));
    if (error) toast.error("Could not assign."); else { toast.success(`${picked.length} assigned`); setPicked([]); }
  }
  return (
    <div className="space-y-4">
      <div className={cn(card, "flex flex-wrap items-end gap-2")}>
        <Button asChild><Link to="/hub/ugc/library/briefs/$briefId" params={{ briefId: "new" }}>New brief</Link></Button>
        <Button variant="outline" onClick={() => setPanel(panel === "quick" ? "none" : "quick")}><Zap className="size-4" />Brief rapide</Button>
        <Button variant="outline" onClick={() => setPanel(panel === "video" ? "none" : "video")}><Film className="size-4" />Brief depuis une vidéo</Button>
        <label className="text-xs font-semibold text-brand-navySoft">Courses<input type="number" min={1} max={20} value={n} onChange={(e) => setN(Math.min(20, Math.max(1, Number(e.target.value))))} className="mt-1 block h-9 w-16 rounded-lg border px-2" /></label>
        <Button variant="outline" disabled={busy} onClick={async () => {
          setBusy(true);
          try { const r = await gen({ data: { count: n, appId: app, language: "fr" } }); toast[r.errors.length ? "warning" : "success"](`${r.created} draft briefs from ${r.courses} courses${r.errors.length ? ` — ${r.errors[0]}` : ""}`); reload(); }
          catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
        }}><Sparkles className="size-4" />{busy ? "Writing…" : "Generate from courses"}</Button>
      </div>
      {panel === "quick" ? <QuickBrief app={app} onClose={() => setPanel("none")} /> : panel === "video" ? <FromVideo app={app} onClose={() => setPanel("none")} /> : null}
      <div className="flex flex-wrap gap-2">
        <select aria-label="Type" className={sel} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="all">All types</option><option value="precise">Précis</option></select>
        <select aria-label="Effort" className={sel} value={f.effort} onChange={(e) => setF({ ...f, effort: e.target.value })}><option value="all">All efforts</option>{Object.entries(EFF).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select aria-label="Status" className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["all", "draft", "scheduled", "published", "archived"].map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Audience" className={sel} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}><option value="all">All audiences</option><option value="selected">Selected creators</option><option value="effort">By effort</option></select>
      </div>
      {picked.length ? (
        <div className={cn(card, "flex flex-wrap items-center gap-2 py-3")}>
          <b className="text-sm">{picked.length} selected</b>
          <Button size="sm" onClick={() => void bulk({ status: "published" }, "published")}>Publish</Button>
          <Button size="sm" variant="outline" onClick={() => void bulk({ status: "scheduled", drop_at: nextMonday() }, "scheduled for Monday")}>Schedule Monday</Button>
          <Button size="sm" variant="outline" onClick={() => void bulk({ status: "archived" }, "archived")}>Archive</Button>
          <select aria-label="Assign to" className={sel} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}><option value="">Assign to…</option>{(data?.creators ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
          <Button size="sm" variant="outline" disabled={!assignTo} onClick={() => void bulkAssign()}>Assign</Button>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr>
            <th className="p-3"><input type="checkbox" aria-label="Select all" checked={rows.length > 0 && picked.length === rows.length} onChange={(e) => setPicked(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
            <th className="p-3">Brief</th><th className="p-3">Score</th><th className="p-3">Effort</th><th className="p-3">Status</th><th className="p-3">Posts</th><th className="p-3">Avg views 7 d</th><th className="p-3">Files</th>
          </tr></thead>
          <tbody>{rows.map((r) => { const s = data?.stats[r.id]; const avg = s?.v7.length ? Math.round(s.v7.reduce((a, b) => a + b, 0) / s.v7.length) : null; return (
            <tr key={r.id} className="border-t border-brand-line">
              <td className="p-3"><input type="checkbox" aria-label={`Select ${r.title}`} checked={picked.includes(r.id)} onChange={(e) => setPicked((x) => (e.target.checked ? [...x, r.id] : x.filter((y) => y !== r.id)))} /></td>
              <td className="max-w-[320px] p-3"><Link to="/hub/ugc/library/briefs/$briefId" params={{ briefId: r.id }} className="font-bold text-brand-navy hover:underline">{r.title}</Link>{r.language === "en" ? <span className="ml-1 rounded bg-portal-bg px-1 text-[10px] font-bold">EN</span> : null}<p className="truncate text-xs text-brand-navySoft">{r.hook_text ?? r.hook}</p></td>
              <td className="p-3">{r.score != null ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", r.score >= 8 ? "bg-portal-green/15 text-portal-green" : "bg-portal-amber/20")}>{r.score}/10</span> : "—"}</td>
              <td className="p-3">{EFF[r.effort ?? ""] ?? "—"}</td>
              <td className="p-3">{r.status}{r.status === "scheduled" && r.drop_at ? <span className="block text-xs text-brand-navySoft">{new Date(r.drop_at).toLocaleDateString()}</span> : null}</td>
              <td className="p-3">{s?.posts ?? 0}</td><td className="p-3">{avg != null ? avg.toLocaleString() : "—"}</td><td className="p-3">{s?.assets ?? 0}</td>
            </tr>); })}</tbody>
        </table>
        {!rows.length ? <p className="p-5 text-sm text-brand-navySoft">No briefs match.</p> : null}
      </div>
    </div>
  );
}
