import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Film, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp, useApps } from "@/lib/apps";
import { generateBriefsFromCourses } from "@/lib/hub-learn.functions";
import { inspirationForLink } from "@/lib/inspirations.functions";
import { assetUploadSlot, briefFromVideo, metaAdsPrepare, studioAi } from "@/lib/brief-studio.functions";
import { STUDIO_DRAFT_KEY, STYLES, STYLE_LABEL, STYLE_NUM, styleDefaults, type BriefStyle } from "@/lib/brief-studio";

function StylePick({ value, onChange }: { value: BriefStyle | ""; onChange: (v: BriefStyle) => void }) {
  return <div><p className="text-sm font-semibold">1. Style</p><div className="mt-1 flex flex-wrap gap-1.5">{STYLES.map(([k, l], i) => <button key={k} type="button" onClick={() => onChange(k)} className={cn("rounded-full border px-3 py-1 text-xs font-bold", value === k ? "border-portal-accent bg-portal-accent/10 text-portal-accent" : "")}>{i + 1}. {l}</button>)}</div></div>;
}

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
  const [idea, setIdea] = useState(""); const [fmt, setFmt] = useState(""); const [busy, setBusy] = useState(false); const [style, setStyle] = useState<BriefStyle | "">("");
  const { data: formats = [] } = useQuery({ queryKey: ["hub", "learn", "fmt-pick", app], queryFn: async () => (await supabase.from("briefs").select("id, title").eq("app_id", app).eq("brief_type", "format").order("sort_order")).data ?? [] });
  return (
    <div className={cn(card, "space-y-3")}>
      <h3 className="font-extrabold text-brand-navy">Brief rapide</h3>
      <StylePick value={style} onChange={setStyle} />
      <label className="block text-sm font-semibold">Le fait / l'idée<textarea rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm" /></label>
      <select aria-label="Format" value={fmt} onChange={(e) => setFmt(e.target.value)} className={cn(sel, "w-full")}><option value="">No format (free)</option>{formats.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}</select>
      <div className="flex gap-2"><Button disabled={busy || !style || idea.trim().length < 5} onClick={async () => {
        setBusy(true);
        try { const r = await ai({ data: { mode: "quick", appId: app, idea, formatId: fmt || null } }); sessionStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify({ ...r.patch, app_id: app, parent_format_id: fmt || null, status: "draft", style, style_data: styleDefaults(style as BriefStyle, { body: (r.patch as { beats?: string[] }).beats?.[1] ?? "" }) })); void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: "new" } }); }
        catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
      }}><Sparkles className="size-4" />{busy ? "Writing…" : "Fill and open the Studio"}</Button><Button variant="ghost" onClick={onClose}>Cancel</Button></div>
    </div>
  );
}

function FromVideo({ app, onClose }: { app: string; onClose: () => void }) {
  const run = useServerFn(briefFromVideo); const forLink = useServerFn(inspirationForLink); const meta = useServerFn(metaAdsPrepare); const [step, setStep] = useState(""); const slot = useServerFn(assetUploadSlot); const qc = useQueryClient();
  const [style, setStyle] = useState<BriefStyle | "">("");
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
        const r = await run({ data: { appId: app, frames, caption: file.name, storagePath: path, style: style || null } });
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
            const r = await run({ data: { appId: app, url: u, ad: x.ad, frames, storagePath: x.video?.path ?? null, style: style || null } });
            setDone((d) => [...d, { label: `${x.ad.pageName || "Ad"} · ${x.ad.adId}`, score: r.score, briefIds: r.briefIds }]);
          }
        } catch (e) { setDone((d) => [...d, { label: u, score: 0, briefIds: [], error: (e as Error).message }]); }
        setStep(""); continue;
      }
      if (/tiktok\.com|instagram\.com/i.test(u)) {
        try {
          setStep("Fetching, transcribing and analysing the video (also saved in Inspiration)…");
          const ins = await forLink({ data: { appId: app, url: u } });
          const ctx = ins ? `@${ins.handle ?? ""}: ${ins.caption ?? ""}\nTranscript (verbatim): ${(ins.transcript ?? "").slice(0, 1400)}` : undefined;
          const r = await run({ data: { appId: app, url: u, caption: ctx?.slice(0, 2000), thumb: ins?.coverUrl ?? null, style: style || null } });
          setDone((d) => [...d, { label: u, score: r.score, briefIds: r.briefIds }]);
        } catch (e) { setDone((d) => [...d, { label: u, score: 0, briefIds: [], error: (e as Error).message }]); if (/credits|blocked/.test((e as Error).message)) break; }
        setStep(""); continue;
      }
      try { const r = await run({ data: { appId: app, url: u, style: style || null } }); setDone((d) => [...d, { label: u, score: r.score, briefIds: r.briefIds }]); }
      catch (e) { setDone((d) => [...d, { label: u, score: 0, briefIds: [], error: (e as Error).message }]); if (/credits|blocked/.test((e as Error).message)) break; }
    }
    setBusy(false); void qc.invalidateQueries({ queryKey: ["hub", "learn"] });
  }
  return (
    <div className={cn(card, "space-y-3")}>
      <h3 className="font-extrabold text-brand-navy">Brief depuis une vidéo</h3>
      <StylePick value={style} onChange={setStyle} />
      <p className="text-xs text-brand-navySoft">Paste up to 20 TikTok, Instagram or Meta Ads Library links (one per line) or upload one file. Meta Ads Library ads are read with their video frame by frame (or their images and copy); a page or search link reads up to 5 ads. Each video is saved in References with its 10-line analysis and a /10 score, and 1-3 adapted draft briefs (never published) are created in the chosen style. TikTok and Instagram links are downloaded, transcribed and analysed through Inspiration (each one also appears there).</p>
      <textarea aria-label="Video links" rows={4} value={urls} onChange={(e) => setUrls(e.target.value)} placeholder="https://www.tiktok.com/@…/video/…" className="w-full rounded-xl border p-3 text-sm" />
      <input type="file" accept="video/*" aria-label="Video file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <div className="flex gap-2"><Button disabled={busy || !style || (!urls.trim() && !file)} onClick={() => void go()}><Film className="size-4" />{busy ? step || `Analysing… ${done.length}` : "Analyse"}</Button><Button variant="ghost" onClick={onClose}>Close</Button></div>
      {done.length ? <ul className="space-y-1 text-sm">{done.map((d, i) => <li key={i} className="rounded-lg bg-portal-bg p-2"><span className="break-all font-semibold">{d.label}</span> — {d.error ? <span className="text-portal-red">{d.error}</span> : <>score {d.score}/10 · {d.briefIds.map((id, j) => <Link key={id} to="/hub/ugc/library/briefs/$briefId" params={{ briefId: id }} className="ml-1 font-bold text-portal-accent">brief {j + 1}</Link>)}</>}</li>)}</ul> : null}
    </div>
  );
}

type Row = { id: string; title: string; hook_text: string | null; hook: string | null; brief_type: string; effort: string | null; status: string; audience: string; audience_efforts: string[]; score: number | null; drop_at: string | null; language: string; created_at: string; style: string | null; app_id: string; updated_at: string | null; inspiration_id: string | null; inspirations: { cover_path: string | null; author_handle: string | null } | null };
const TABS = [["formats", "Formats"], ["mine", "My briefs"], ["published", "Published"], ["archived", "Archived"]] as const;
const inTab = (t: string, s: string) => (t === "published" ? s === "published" || s === "scheduled" : t === "mine" ? s === "draft" || s === "ready" : s === t);
const STATUS_LABEL: Record<string, string> = { draft: "Draft", ready: "Ready", published: "Published", scheduled: "Scheduled", archived: "Archived" };
export { QuickBrief, FromVideo };

export function BriefsList({ formats, initialTab }: { formats?: ReactNode; initialTab?: string } = {}) {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient(); const navigate = useNavigate();
  const { data: apps = [] } = useApps();
  const appName = (id: string) => (apps as { id: string; name: string }[]).find((a) => a.id === id)?.name ?? "—";
  const [tab, setTab] = useState<string>(initialTab === "formats" ? "formats" : "mine");
  const [q, setQ] = useState(""); const [style, setStyle] = useState("all"); const [lang, setLang] = useState("all");
  const [menu, setMenu] = useState(false); const [filterOpen, setFilterOpen] = useState(false); const [pickFmt, setPickFmt] = useState(false);
  const { data } = useQuery({
    queryKey: ["hub", "learn", "briefs", app],
    queryFn: async () => {
      const [b, p, f] = await Promise.all([
        supabase.from("briefs").select("id, title, hook_text, hook, brief_type, effort, status, audience, audience_efforts, score, drop_at, language, created_at, style, app_id, updated_at, inspiration_id, inspirations(cover_path, author_handle)").eq("app_id", app).neq("brief_type", "format").order("updated_at", { ascending: false }).limit(500),
        supabase.from("creator_posts").select("brief_id, views, posted_on").not("brief_id", "is", null),
        supabase.from("briefs").select("id, title").eq("app_id", app).eq("brief_type", "format").order("sort_order"),
      ]);
      const stats: Record<string, { posts: number; v7: number[] }> = {};
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
      for (const r of p.data ?? []) { const x = (stats[r.brief_id!] ??= { posts: 0, v7: [] }); x.posts++; if (r.posted_on && r.posted_on <= weekAgo) x.v7.push(Number(r.views ?? 0)); }
      return { rows: (b.data ?? []) as unknown as Row[], stats, formats: (f.data ?? []) as { id: string; title: string }[] };
    },
  });
  const counts = useMemo(() => ({ ...Object.fromEntries(TABS.map(([k]) => [k, (data?.rows ?? []).filter((r) => inTab(k, r.status)).length])), formats: data?.formats.length ?? 0 }) as Record<string, number>, [data]);
  const rows = useMemo(() => (data?.rows ?? []).filter((r) => inTab(tab, r.status) && (lang === "all" || r.language === lang)
    && (style === "all" || (style === "none" ? !r.style : r.style === style))
    && (!q || `${r.title} ${r.hook_text ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [data, tab, lang, style, q]);
  const coverPaths = rows.map((r) => r.inspirations?.cover_path).filter(Boolean) as string[];
  const { data: covers = {} } = useQuery({ queryKey: ["hub", "brief-covers", coverPaths.join("|")], enabled: coverPaths.length > 0, staleTime: 50 * 60_000, queryFn: async () => Object.fromEntries(((await supabase.storage.from("inspirations").createSignedUrls(coverPaths, 3600)).data ?? []).map((d) => [d.path, d.signedUrl])) as Record<string, string> });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "learn"] });
  async function copyBrief(id: string, fromFormat: boolean) {
    const { data: src } = await supabase.from("briefs").select("*").eq("id", id).single(); if (!src) return;
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = src as Record<string, unknown>; void _id; void _c; void _u;
    const extra = fromFormat ? { brief_type: "precise", parent_format_id: id, pinned: false, title: String(src.title) } : { title: `Copy of ${String(src.title)}` };
    const { data: n, error } = await supabase.from("briefs").insert({ ...rest, ...extra, status: "draft", drop_at: null } as never).select("id").single();
    if (error || !n) { toast.error("Could not duplicate."); return; }
    const { data: ba } = await supabase.from("brief_assets").select("asset_id, role, sort_order").eq("brief_id", id);
    if (ba?.length) await supabase.from("brief_assets").insert(ba.map((x) => ({ ...x, brief_id: n.id })));
    reload();
    if (fromFormat) void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: n.id } }); else toast.success("Duplicated as a draft");
  }
  async function patchOne(id: string, patch: Record<string, unknown>, label: string) {
    if (patch["status"] === "published" && !window.confirm("Publish to creators? This makes the brief visible to creators.")) return;
    const { error } = await supabase.from("briefs").update(patch as never).eq("id", id); if (error) toast.error("Could not update."); else { toast.success(label); reload(); }
  }
  async function removeOne(r: Row) {
    if (r.status === "published" || r.status === "scheduled") { toast.error("Archive a published brief instead of deleting it."); return; }
    if (!window.confirm(`Delete “${r.title}”? This cannot be undone.`)) return;
    await supabase.from("brief_assets").delete().eq("brief_id", r.id);
    const { error } = await supabase.from("briefs").delete().eq("id", r.id); if (error) toast.error("Could not delete."); else { toast.success("Deleted"); reload(); }
  }
  const pub = tab === "published"; const filtered = style !== "all" || lang !== "all";
  const chip = "rounded bg-portal-bg px-1.5 py-0.5 text-[10px] font-bold text-brand-navySoft";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Briefs">{TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("min-h-9 shrink-0 rounded-full px-4 text-sm font-bold", tab === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l} ({counts[k] ?? 0})</button>)}</div>
        <div className="relative ml-auto">
          <Button aria-expanded={menu} onClick={() => setMenu(!menu)}>New brief ▾</Button>
          {menu ? <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border bg-card p-1 shadow-portal" role="menu">
            <Link role="menuitem" to="/hub/ugc/library/briefs/$briefId" params={{ briefId: "new" }} className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-portal-bg">Blank</Link>
            <Link role="menuitem" to="/hub/ugc/inspiration" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-portal-bg">From an inspiration</Link>
            <button role="menuitem" type="button" onClick={() => { setMenu(false); setPickFmt(true); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-portal-bg">From a format</button>
          </div> : null}
        </div>
      </div>
      {pickFmt ? <div className={cn(card, "space-y-2")}><div className="flex items-center justify-between"><b className="text-brand-navy">Pick a format to start from</b><Button size="sm" variant="ghost" onClick={() => setPickFmt(false)}>Cancel</Button></div>
        <p className="text-xs text-brand-navySoft">It is copied as a draft; the format itself is not changed.</p>
        <div className="grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2">{(data?.formats ?? []).map((f) => <button key={f.id} type="button" onClick={() => { setPickFmt(false); void copyBrief(f.id, true); }} className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-portal-bg">{f.title}</button>)}</div></div> : null}
      {tab === "formats" ? formats ?? null : <>
      <div className="flex gap-2">
        <input aria-label="Search briefs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className={cn(sel, "min-w-0 flex-1")} />
        <div className="relative"><Button variant="outline" size="sm" className="h-9" aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}>Filter{filtered ? " •" : ""}</Button>
          {filterOpen ? <div className="absolute right-0 z-20 mt-1 w-64 space-y-2 rounded-xl border bg-card p-3 shadow-portal">
            <label className="block text-xs font-semibold">Style<select className={cn(sel, "mt-1 w-full")} value={style} onChange={(e) => setStyle(e.target.value)}><option value="all">All styles</option>{STYLES.map(([k, l], i) => <option key={k} value={k}>{i + 1}. {l}</option>)}<option value="none">No style</option></select></label>
            <label className="block text-xs font-semibold">Language<select className={cn(sel, "mt-1 w-full")} value={lang} onChange={(e) => setLang(e.target.value)}><option value="all">All</option><option value="fr">FR</option><option value="en">EN</option></select></label>
          </div> : null}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        {rows.length ? <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Brief</th><th className="p-3">Status</th><th className="p-3">Score</th>{pub ? <><th className="p-3">Posts</th><th className="p-3">Avg views 7d</th></> : null}<th className="p-3">Last edited</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{rows.map((r) => { const s = data?.stats[r.id]; const avg = s?.v7.length ? Math.round(s.v7.reduce((a, b) => a + b, 0) / s.v7.length) : null; const isPub = r.status === "published" || r.status === "scheduled"; return (
            <tr key={r.id} className="border-t border-brand-line">
              <td className="max-w-[380px] p-3"><div className="flex items-start gap-2">{r.inspirations?.cover_path && covers[r.inspirations.cover_path] ? <img src={covers[r.inspirations.cover_path]} alt="" className="h-10 w-7 shrink-0 rounded object-cover" loading="lazy" /> : null}<div className="min-w-0"><Link to="/hub/ugc/library/briefs/$briefId" params={{ briefId: r.id }} className="font-bold text-brand-navy hover:underline">{r.title || "Untitled"}</Link>
                <div className="mt-1 flex flex-wrap gap-1"><span className={chip}>{appName(r.app_id)}</span>{r.style ? <span className={chip}>{STYLE_NUM[r.style]}. {STYLE_LABEL[r.style]}</span> : null}{r.language === "en" ? <span className={chip}>EN</span> : null}</div></div></div></td>
              <td className="p-3">{STATUS_LABEL[r.status] ?? r.status}</td>
              <td className="p-3">{r.score != null ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", r.score >= 8 ? "bg-portal-green/15 text-portal-green" : "bg-portal-amber/20")}>{r.score}/10</span> : "—"}</td>
              {pub ? <><td className="p-3">{s?.posts ?? 0}</td><td className="p-3">{avg != null ? avg.toLocaleString() : "—"}</td></> : null}
              <td className="whitespace-nowrap p-3 text-xs text-brand-navySoft">{new Date(r.updated_at ?? r.created_at).toLocaleDateString("en-GB")}</td>
              <td className="p-3"><select aria-label={`Actions for ${r.title}`} className={cn(sel, "h-8 w-12 text-xs")} value="" onChange={(e) => { const v = e.target.value;
                if (v === "open") void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: r.id } });
                else if (v === "dup") void copyBrief(r.id, false);
                else if (v === "publish") void patchOne(r.id, { status: "published" }, "Published");
                else if (v === "unpublish") void patchOne(r.id, { status: "ready", drop_at: null }, "Unpublished");
                else if (v === "archive") void patchOne(r.id, { status: "archived" }, "Archived");
                else if (v === "restore") void patchOne(r.id, { status: "draft" }, "Back in My briefs");
                else if (v === "delete") void removeOne(r); }}>
                <option value="">⋯</option><option value="open">Open</option><option value="dup">Duplicate</option>
                {isPub ? <option value="unpublish">Unpublish</option> : r.status !== "archived" ? <option value="publish">Publish…</option> : <option value="restore">Restore</option>}
                {r.status !== "archived" ? <option value="archive">Archive</option> : null}
                {!isPub ? <option value="delete">Delete…</option> : null}
              </select></td>
            </tr>); })}</tbody>
        </table> : <p className="p-5 text-sm text-brand-navySoft">{tab === "mine" ? "No briefs yet — click New brief." : tab === "published" ? "No published briefs yet." : "No archived briefs."}</p>}
      </div>
      </>}
    </div>
  );
}
