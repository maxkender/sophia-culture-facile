import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, Play, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdminApp, SOPHIA_APP_ID } from "@/lib/apps";
import { STYLES, STYLE_LABEL, blankBrief, blankFmt, scoreBrief, styleAssetIds, styleDefaults, type BriefStyle, type Plan, type StyleData } from "@/lib/brief-studio";
import { backfillNotionFormat } from "@/lib/notion.functions";
import { NotionItemsTab } from "./NotionSync";
import { FromVideo } from "./BriefsList";
import { notionSyncNow } from "@/lib/notion.functions";
import { deleteInspirations, importInspirations, inspirationToReference, processInspirations, retryInspirationErrors, retranscribeInspiration } from "@/lib/inspirations.functions";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const f = "h-9 rounded-lg border bg-card px-2 text-sm";
const ALL_STYLES: [string, string][] = [...STYLES.map(([k, l]) => [k, l] as [string, string]), ["slideshow", "Slideshow"], ["other", "Other"]];
const SLABEL: Record<string, string> = { ...STYLE_LABEL, slideshow: "Slideshow", other: "Other" };
const STAGES = ["queued", "fetching", "transcribing", "analysing", "analyzed", "error"] as const;
const STAGE_LABEL: Record<string, string> = { queued: "Queued", fetching: "Fetching", transcribing: "Transcribing", analysing: "Analysing", analyzed: "Done", error: "Error" };
const FIT = [["sophia", "Sophia"], ["unswipe", "UnSwipe"], ["both", "Both"], ["none", "None"]] as const;

type Word = { t: string; s: number; e: number; ev?: boolean };
type An = { hook: { verbatim: string; on_screen: string; visual: string }; structure: { start_s: number; end_s: number; seen: string; said: string; on_screen: string }[]; cta: string; on_screen_text_style: string; audio: string; audio_note: string; why_it_works: string[] };
export type Insp = {
  id: string; app_id: string | null; batch_id: string | null; url: string; platform: string; kind: string; status: string; error: string | null; attempts: number;
  author_handle: string | null; caption: string | null; hashtags: string[]; cover_path: string | null; video_path: string | null; duration_s: number | null;
  views: number | null; likes: number | null; comments: number | null; shares: number | null; posted_at: string | null;
  transcript: string | null; language: string | null; words: Word[] | null; analysis: An | null; proposed_style: string | null; style_confidence: number | null; approved_style: string | null;
  hook_text: string | null; hook_type: string | null; score: number | null; app_fit: string | null; tags: string[]; cost: Record<string, number | string>; reference_id: string | null; created_at: string;
  notion_page_id?: string | null; notion_notes?: string | null; notion_format?: string | null;
};
export const NOTION_FORMATS = ["Face caméra", "POV / lifestyle", "Démo app", "Storytime", "Sketch", "Slideshow", "Montage / edit", "Voix off", "Autre"];
const UNSWIPE_ID = "00000000-0000-4000-8000-000000000002";
const KEY = ["hub", "inspirations"];
const fmtN = (n: number | null) => (n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const styleOf = (r: Insp) => r.approved_style ?? r.proposed_style;
export const costOf = (c: Insp["cost"]) => Number(c["apify_usd"] ?? 0) + Number(c["stt_usd"] ?? 0);

function useInspirations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => ((await supabase.from("inspirations").select("*").order("created_at", { ascending: false }).limit(2000)).data ?? []) as unknown as Insp[],
    refetchInterval: (q) => ((q.state.data as Insp[] | undefined)?.some((r) => !["analyzed", "error"].includes(r.status)) ? 8000 : false),
  });
}
function useCovers(rows: Insp[]) {
  const paths = rows.map((r) => r.cover_path).filter(Boolean) as string[];
  return useQuery({
    queryKey: ["hub", "insp-covers", paths.join("|")], enabled: paths.length > 0, staleTime: 50 * 60_000,
    queryFn: async () => { const { data } = await supabase.storage.from("inspirations").createSignedUrls(paths, 3600); return Object.fromEntries((data ?? []).map((d) => [d.path, d.signedUrl])) as Record<string, string>; },
  });
}

export function Inspiration({ initialOpen, initialAuthor }: { initialOpen?: string | undefined; initialAuthor?: string | undefined } = {}) {
  const { data: all = [], isLoading } = useInspirations(); const { appId } = useAdminApp(); const qc = useQueryClient();
  const [flt, setFlt] = useState({ q: initialAuthor ?? "", style: "all", fit: "all", lang: "all", platform: "all", hook: "all", minScore: 0, status: "all", tag: "", since: "" });
  const [sort, setSort] = useState<"date" | "views" | "score">("date");
  const [sel, setSel] = useState<Set<string>>(new Set()); const [open, setOpen] = useState<string | null>(initialOpen ?? null); const [tab, setTab] = useState<"videos" | "notion">("videos"); const [adding, setAdding] = useState(false);
  const rows = useMemo(() => {
    const q = flt.q.toLowerCase();
    const out = all.filter((r) => (!appId || !r.app_id || r.app_id === appId)
      && (flt.style === "all" || styleOf(r) === flt.style) && (flt.fit === "all" || r.app_fit === flt.fit) && (flt.lang === "all" || r.language === flt.lang)
      && (flt.platform === "all" || r.platform === flt.platform) && (flt.hook === "all" || r.hook_type === flt.hook) && (r.score ?? 0) >= flt.minScore
      && (flt.status === "all" || r.status === flt.status) && (!flt.tag || r.tags.some((t) => t.includes(flt.tag.toLowerCase())))
      && (!flt.since || (r.posted_at ?? r.created_at) >= flt.since)
      && (!q || `${r.transcript ?? ""} ${r.caption ?? ""} ${r.author_handle ?? ""}`.toLowerCase().includes(q)));
    return out.sort((a, b) => sort === "views" ? (b.views ?? 0) - (a.views ?? 0) : sort === "score" ? (b.score ?? 0) - (a.score ?? 0) : b.created_at.localeCompare(a.created_at));
  }, [all, appId, flt, sort]);
  const covers = useCovers(rows.slice(0, 120)).data ?? {};
  const langs = [...new Set(all.map((r) => r.language).filter(Boolean))] as string[];
  const hooks = [...new Set(all.map((r) => r.hook_type).filter(Boolean))] as string[];
  const current = all.find((r) => r.id === open) ?? null;
  const refresh = () => void qc.invalidateQueries({ queryKey: KEY });

  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="tablist">{([["videos", "Videos"], ["notion", "Notion"]] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", tab === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l}</button>)}</div>
      {tab === "notion" ? <NotionItemsTab onOpen={(id) => setOpen(id)} /> : <>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Search inspiration" placeholder="Search…" value={flt.q} onChange={(e) => setFlt({ ...flt, q: e.target.value })} className={cn(f, "min-w-0 flex-1 sm:max-w-80")} />
        <Button onClick={() => setAdding(!adding)} aria-expanded={adding}><Upload className="size-4" />Add links</Button>
        <SyncNotionButton onDone={refresh} />
      </div>
      {adding ? <ImportPanel rows={all} appId={appId} onDone={refresh} /> : null}
      {isLoading ? <p className="text-sm text-brand-navySoft">Loading…</p> : !rows.length ? (
        <div className={cn(card, "text-center text-sm text-brand-navySoft")}>{all.length ? "Nothing matches this search." : "No inspiration yet — click Add links."}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((r) => (
            <div key={r.id} className="group relative overflow-hidden rounded-2xl bg-card shadow-portal">
              <button type="button" onClick={() => setOpen(r.id)} className="block w-full text-left">
                <div className="relative aspect-[9/14] bg-muted">
                  {r.cover_path && covers[r.cover_path] ? <img src={covers[r.cover_path]} alt="" loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-xs text-brand-navySoft">{STAGE_LABEL[r.status] ?? r.status}</div>}
                  {r.status !== "analyzed" ? <span className={cn("absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold", r.status === "error" ? "bg-destructive text-destructive-foreground" : "bg-card text-brand-navy")}>{STAGE_LABEL[r.status]}</span> : r.score != null ? <span className="absolute right-2 top-2 rounded-full bg-card px-2 py-0.5 text-xs font-extrabold text-brand-navy">{r.score}/10</span> : null}
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-brand-navy/80 px-2 py-0.5 text-[11px] font-bold text-card"><Play className="size-3" />{fmtN(r.views)} · {r.duration_s ? `${Math.round(r.duration_s)}s` : "—"}</span>
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-bold text-brand-navy">@{r.author_handle ?? "…"} <span className="text-xs font-normal text-brand-navySoft">{r.platform === "tiktok" ? "TikTok" : "Instagram"}</span></p>
                  {r.hook_text || r.analysis?.hook.verbatim ? <p className="line-clamp-2 text-xs text-brand-navy">« {r.hook_text || r.analysis?.hook.verbatim} »</p> : null}
                  <div className="flex flex-wrap gap-1">
                    {styleOf(r) ? <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", r.approved_style ? "bg-space-ugc text-card" : "bg-space-ugc/10 text-space-ugc")}>{SLABEL[styleOf(r)!]}</span> : null}
                    {r.notion_page_id ? <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-bold text-card" title="Imported from Notion">N · From Notion</span> : null}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
      </>}
      <Sheet open={Boolean(current)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">{current ? <Drawer r={current} onChange={refresh} onClose={() => setOpen(null)} /> : null}</SheetContent>
      </Sheet>
    </div>
  );
}

function SyncNotionButton({ onDone }: { onDone: () => void }) {
  const run = useServerFn(notionSyncNow); const [busy, setBusy] = useState(false);
  return <Button variant="outline" disabled={busy} onClick={async () => {
    setBusy(true);
    try { const r = await run(); if (r["skipped"]) toast.message(String(r["skipped"])); else toast.success("Notion synced"); onDone(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }}>{busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Sync Notion</Button>;
}

function parseCsv(text: string) { return text.split(/\r?\n/).map((l) => l.split(/[,;\t]/).find((c) => /https?:\/\//.test(c)) ?? "").map((c) => c.trim().replace(/^"|"$/g, "")).filter(Boolean); }

function ImportPanel({ rows, appId, onDone }: { rows: Insp[]; appId: string | null; onDone: () => void }) {
  const imp = useServerFn(importInspirations); const retry = useServerFn(retryInspirationErrors);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [ads, setAds] = useState(false); const [app, setApp] = useState<string>(appId ?? SOPHIA_APP_ID);
  const batches = useMemo(() => {
    const m = new Map<string, Insp[]>(); for (const r of rows) { const k = r.batch_id ?? "none"; m.set(k, [...(m.get(k) ?? []), r]); }
    return [...m.entries()].slice(0, 5);
  }, [rows]);
  async function send(links: string[]) {
    if (!links.length) return; setBusy(true);
    try { const r = await imp({ data: { links, appId: app } }); toast.success(`${r.added} queued · ${r.duplicates} already in Inspiration${r.invalid ? ` · ${r.invalid} not TikTok/Instagram video links` : ""}`); setText(""); onDone(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className={cn(card, "space-y-3")}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold text-brand-navy">Add links</h3>
        <select aria-label="App for this import" className={f} value={app} onChange={(e) => setApp(e.target.value)}><option value={SOPHIA_APP_ID}>For Sophia</option><option value="00000000-0000-4000-8000-000000000002">For UnSwipe</option></select></div>
      <p className="text-xs text-brand-navySoft">Paste TikTok and Instagram reel links, one per line (hundreds at a time), or upload a CSV with one column of links. Duplicates are skipped. Each video is downloaded, transcribed and analysed in the background, 5 at a time every minute.</p>
      <textarea aria-label="Links to import" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={"https://www.tiktok.com/@…/video/…\nhttps://www.instagram.com/reel/…"} className="w-full rounded-xl border p-3 text-sm" />
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !text.trim()} onClick={() => void send(text.split(/\s+/))}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}Import {text.split(/\s+/).filter((x) => /^https?:/.test(x)).length || ""} links</Button>
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold"><Upload className="size-4" />CSV<input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={async (e) => { const fl = e.target.files?.[0]; if (fl) await send(parseCsv(await fl.text())); e.target.value = ""; }} /></label>
        <Button variant="outline" onClick={() => setAds(!ads)} aria-expanded={ads}>From Ads Library</Button>
        <Button variant="ghost" onClick={async () => { const r = await retry({ data: { batchId: null } }); toast.success(`${r.requeued} re-queued`); onDone(); }}><RefreshCw className="size-4" />Retry errors</Button>
      </div>
      {ads ? <FromVideo app={app} onClose={() => setAds(false)} /> : null}
      {batches.length ? <div className="space-y-1.5">{batches.map(([id, list]) => {
        const c = Object.fromEntries(STAGES.map((s) => [s, list.filter((r) => r.status === s).length]));
        const cost = list.reduce((n, r) => n + costOf(r.cost), 0);
        return <div key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/50 px-3 py-2 text-xs text-brand-navy"><b>{new Date(list[list.length - 1]!.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} · {list.length} links</b>{STAGES.map((s) => c[s] ? <span key={s} className={s === "error" ? "font-bold text-destructive" : ""}>{STAGE_LABEL[s]} {c[s]}</span> : null)}<span className="text-brand-navySoft">≈ ${cost.toFixed(3)} Apify + transcription</span></div>;
      })}</div> : null}
    </div>
  );
}

function BulkBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const proc = useServerFn(processInspirations); const del = useServerFn(deleteInspirations); const [busy, setBusy] = useState(false);
  async function upd(patch: Record<string, unknown>) { await supabase.from("inspirations").update(patch as never).in("id", ids); onDone(); }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-2 text-sm">
      <b className="px-1 text-brand-navy">{ids.length} selected</b>
      <select aria-label="Approve style" className={f} defaultValue="" onChange={(e) => e.target.value && void upd({ approved_style: e.target.value === "proposed" ? null : e.target.value })}><option value="">Approve style…</option>{ALL_STYLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <select aria-label="Set app fit" className={f} defaultValue="" onChange={(e) => e.target.value && void upd({ app_fit: e.target.value })}><option value="">Set app fit…</option>{FIT.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <Button size="sm" variant="outline" onClick={async () => { const t = window.prompt("Tag to add"); if (!t) return; const { data } = await supabase.from("inspirations").select("id, tags").in("id", ids); for (const r of data ?? []) await supabase.from("inspirations").update({ tags: [...new Set([...(r.tags ?? []), t.trim().toLowerCase()])] }).eq("id", r.id); onDone(); }}>Add tag</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { for (let i = 0; i < ids.length; i += 5) await proc({ data: { ids: ids.slice(i, i + 5), analyseOnly: true } }); toast.success("Analysis re-run"); } catch (e) { toast.error((e as Error).message); } setBusy(false); onDone(); }}>{busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Re-run analysis</Button>
      <Button size="sm" variant="outline" className="text-destructive" onClick={async () => { if (!window.confirm(`Delete ${ids.length} inspiration(s) and their stored videos?`)) return; await del({ data: { ids } }); onDone(); }}><Trash2 className="size-4" />Delete</Button>
    </div>
  );
}

/** Plans prefilled from the analysed structure, shaped for the chosen style. */
export function draftFromInspiration(r: Insp, appId: string) {
  const style = (styleOf(r) && STYLES.some(([k]) => k === styleOf(r)) ? styleOf(r) : "broll_stickers") as BriefStyle;
  const an = r.analysis; const st = an?.structure ?? [];
  const plan = (s: An["structure"][number]): Plan => ({ on_screen: s.on_screen, fmt: blankFmt(), say: s.said, do: s.seen, camera: "", reaction: "", assets: [] });
  let d: StyleData = { cta: an?.cta ?? "", body: "" };
  if (style === "reaction_demo") d.plans = [st[0] ? { ...plan(st[0]), reaction: st[0].seen } : plan({ start_s: 0, end_s: 0, seen: "", said: "", on_screen: "" }), ...st.slice(1, 2).map(plan)];
  else if (style === "broll_stickers") d.plans = st.map(plan);
  else if (style === "talked_hook_demo") { const last = st[st.length - 1]; d.plans = st.slice(0, -1).map(plan); d.demo = { mode: "filmed", do: last?.seen ?? "", say: last?.said ?? "", asset: null }; }
  else if (style === "sole_footage") d.sole = { what: st.map((s) => s.seen).join(" / "), duration_s: r.duration_s ? Math.round(r.duration_s) : 7, music_title: an?.audio_note ?? "", music_link: "", music_asset_id: null, text: st.map((s) => s.on_screen).filter(Boolean).join(" / "), fmt: { kind: "title", note: an?.on_screen_text_style ?? "" } };
  else d.script = r.transcript ?? st.map((s) => s.said).join("\n");
  d = styleDefaults(style, d);
  return {
    app_id: appId, status: "draft", style, style_data: d, title: `From @${r.author_handle ?? "inspiration"}`, language: r.language?.startsWith("en") ? "en" : "fr",
    hook_text: an?.hook.on_screen || an?.hook.verbatim || "", oral_hook: an?.hook.verbatim ?? "", hook_visual: an?.hook.visual ?? "", hooks: [an?.hook.on_screen || an?.hook.verbatim || ""].filter(Boolean),
    duration_target: r.duration_s ? `${Math.round(r.duration_s)}s` : "30s",
  };
}

const firstWords = (s: string, n: number) => s.split(/\s+/).filter(Boolean).slice(0, n).join(" ");
/** Why the button is disabled, or null when the inspiration can become a brief. */
export function briefBlocker(r: Insp): string | null {
  if (r.status === "analyzed" && r.analysis && r.transcript != null) return null;
  if (r.transcript == null && (r.status === "error" || r.video_path)) return "Transcription failed → Re-transcribe";
  return "Not analyzed yet";
}
/** Creates ONE draft brief from the inspiration (never published) and returns its id. */
export async function createBriefFromInspiration(r: Insp, appId: string): Promise<string> {
  const d = draftFromInspiration(r, appId); const an = r.analysis; const st = an?.structure ?? [];
  const beats = st.map((s) => `${s.start_s.toFixed(1)}–${s.end_s.toFixed(1)} s · Seen: ${s.seen}${s.on_screen ? ` · On screen: ${s.on_screen}` : ""}${s.said ? ` · Said: « ${s.said} »` : ""}`);
  const pm = st.find((s) => /\b(app|phone|screen|écran|téléphone|sophia|unswipe)\b/i.test(`${s.seen} ${s.said}`));
  const hook = r.hook_text || an?.hook.on_screen || an?.hook.verbatim || "";
  const b = { ...blankBrief(appId), ...d, brief_type: "precise" as const, beats: beats.length ? beats : ["", "", ""], hook_text: hook, oral_hook: an?.hook.verbatim ?? "", hook_visual: an?.hook.on_screen || an?.hook.visual || "", product_moment: pm ? `${pm.start_s.toFixed(1)} s — ${pm.seen}` : "", title: `From: @${r.author_handle ?? "inspiration"} – ${firstWords(hook, 6)}`.slice(0, 140) };
  const grade = scoreBrief(b as never, (b.style ? styleAssetIds(b.style_data).length : 0) + (r.reference_id ? 1 : 0));
  const { data, error } = await supabase.from("briefs").insert({
    app_id: appId, title: b.title, brief_type: "precise", status: "draft", style: b.style, style_data: b.style_data as never, effort: b.effort, format: b.effort, platform: b.platform, duration_target: b.duration_target,
    hook_text: b.hook_text, hook: b.hook_text, hooks: [b.hook_text, b.oral_hook, b.hook_visual].filter(Boolean), oral_hook: b.oral_hook, hook_visual: b.hook_visual, beats: b.beats as never, script: b.beats.join("\n"),
    product_moment: b.product_moment, product_second: pm ? Math.round(pm.start_s) : b.product_second, product_gesture: b.product_gesture, say_name: b.say_name, rules_do: b.rules_do, rules_dont: b.rules_dont,
    tags: r.tags, language: b.language, audience: "all", score: grade.score, inspiration_id: r.id, source_reference_id: r.reference_id, reference_video_ids: r.reference_id ? [r.reference_id] : [],
  } as never).select("id").single();
  if (error || !data) throw new Error("The brief could not be created.");
  return (data as { id: string }).id;
}
function CreateBriefButton({ r, compact }: { r: Insp; compact?: boolean }) {
  const navigate = useNavigate(); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  const [app, setApp] = useState<string>(r.app_id ?? (r.app_fit === "unswipe" ? UNSWIPE_ID : SOPHIA_APP_ID));
  const why = briefBlocker(r);
  const go = async () => { setBusy(true); try { const id = await createBriefFromInspiration(r, app); toast.success("Draft brief created"); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); void navigate({ to: "/hub/ugc/briefs/$briefId", params: { briefId: id } }); } catch (e) { toast.error((e as Error).message); } setBusy(false); };
  if (compact) return <button type="button" disabled={Boolean(why) || busy} title={why ?? "Create brief from this inspiration"} onClick={() => void go()} className="w-full border-t border-brand-line px-3 py-1.5 text-left text-[11px] font-bold text-portal-accent disabled:text-brand-navySoft">{why ?? "Create brief from this inspiration"}</button>;
  return <span className="inline-flex flex-wrap items-center gap-1">
    {!r.app_id ? <select aria-label="App for the brief" className={f} value={app} onChange={(e) => setApp(e.target.value)}><option value={SOPHIA_APP_ID}>Sophia</option><option value={UNSWIPE_ID}>UnSwipe</option></select> : null}
    <Button size="lg" className="text-base font-extrabold" disabled={Boolean(why) || busy} title={why ?? undefined} onClick={() => void go()} data-testid="make-brief">{busy ? <Loader2 className="size-4 animate-spin" /> : null}Make a brief</Button>
    {why ? <span className="text-xs text-brand-navySoft">{why}</span> : null}
  </span>;
}

/** Reference panel in the Brief Studio: video, transcript and why it works. */
export function InspirationReference({ id }: { id: string }) {
  const { data: r } = useQuery({ queryKey: ["hub", "insp-ref", id], queryFn: async () => (await supabase.from("inspirations").select("*").eq("id", id).maybeSingle()).data as unknown as Insp | null });
  const [src, setSrc] = useState<string | null>(null); const [t, setT] = useState(0); const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (r?.video_path) void supabase.storage.from("inspirations").createSignedUrl(r.video_path, 3600).then(({ data }) => setSrc(data?.signedUrl ?? null)); }, [r?.video_path]);
  if (!r) return null;
  const words = (r.words ?? []).filter((w) => !w.ev);
  return <details open className={cn(card, "space-y-3")} data-testid="inspiration-ref"><summary className="cursor-pointer font-extrabold text-brand-navy">Reference · @{r.author_handle ?? "…"} (Inspiration)</summary>
    <div className="mt-3 grid gap-4 sm:grid-cols-[220px_1fr]">
      {src ? <video ref={v} src={src} controls playsInline onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} className="max-h-96 w-full rounded-xl bg-brand-navy" aria-label="Reference video" /> : <div className="h-40 rounded-xl bg-muted" />}
      <div className="space-y-2 text-sm text-brand-navy">
        <p className="text-xs font-bold uppercase text-brand-navySoft">Why it works</p><ul className="list-disc pl-5">{(r.analysis?.why_it_works ?? []).map((w, i) => <li key={i}>{w}</li>)}</ul>
        <p className="text-xs font-bold uppercase text-brand-navySoft">Transcript</p>
        {words.length ? <p className="max-h-48 overflow-y-auto leading-relaxed" data-testid="ref-transcript">{words.map((w, i) => <span key={i} onClick={() => { if (v.current) { v.current.currentTime = w.s; void v.current.play(); } }} className={cn("cursor-pointer rounded", t >= w.s && t < w.e + 0.05 ? "bg-space-ugc text-card" : "")}>{w.t} </span>)}</p> : <p className="text-brand-navySoft">{r.transcript || "No speech in this video."}</p>}
      </div>
    </div>
  </details>;
}

function Drawer({ r, onChange, onClose }: { r: Insp; onChange: () => void; onClose?: () => void }) {
  const del = useServerFn(deleteInspirations);
  const toRef = useServerFn(inspirationToReference); const retx = useServerFn(retranscribeInspiration); const [rtBusy, setRtBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null); const [t, setT] = useState(0); const [src, setSrc] = useState<string | null>(null);
  const [tags, setTags] = useState(r.tags.join(", "));
  useEffect(() => { setTags(r.tags.join(", ")); }, [r.id, r.tags]);
  useEffect(() => { let on = true; setSrc(null); if (r.video_path) void supabase.storage.from("inspirations").createSignedUrl(r.video_path, 3600).then(({ data }) => on && setSrc(data?.signedUrl ?? null)); return () => { on = false; }; }, [r.video_path]);
  const seek = (s: number) => { if (video.current) { video.current.currentTime = s; void video.current.play(); } };
  async function upd(patch: Record<string, unknown>) { const { error } = await supabase.from("inspirations").update({ ...patch, updated_at: new Date().toISOString() } as never).eq("id", r.id); if (error) toast.error("Could not save"); onChange(); }
  const appForSave = r.app_fit === "unswipe" ? "00000000-0000-4000-8000-000000000002" : r.app_id ?? SOPHIA_APP_ID;
  async function saveHook() {
    const text = r.analysis?.hook.verbatim || r.hook_text || ""; if (!text) { toast.error("No hook text on this video"); return; }
    const style = styleOf(r); const { error } = await supabase.from("brief_snippets").insert({ kind: "hook", text, app_id: r.app_fit === "both" ? null : appForSave, language: (r.language ?? "fr").slice(0, 2), styles: style && STYLES.some(([k]) => k === style) ? [style] : [], tags: r.tags, why: r.analysis?.why_it_works?.join(" ") ?? null, source_url: r.url } as never);
    if (error) toast.error("Could not save the hook"); else toast.success("Hook saved to the Hooks library");
  }
  const words = (r.words ?? []).filter((w) => !w.ev);
  const c = r.cost ?? {};
  const fill = useServerFn(backfillNotionFormat);
  useEffect(() => { if (r.status === "analyzed" && !r.notion_format) void fill({ data: { ids: [r.id] } }).then(onChange).catch(() => undefined); }, [r.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-4">
      <SheetHeader><SheetTitle>@{r.author_handle ?? "…"} · {r.platform === "tiktok" ? "TikTok" : "Instagram"}</SheetTitle></SheetHeader>
      {r.status !== "analyzed" ? <p className={cn("rounded-lg p-2 text-sm", r.status === "error" ? "bg-destructive/10 text-destructive" : "bg-muted")}>{STAGE_LABEL[r.status]}{r.error ? ` — ${r.error}` : ""}{r.attempts ? ` (attempt ${r.attempts})` : ""}</p> : null}
      {r.video_path ? (src ? <video ref={video} src={src} controls playsInline onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} className="mx-auto max-h-[60vh] rounded-xl bg-brand-navy" aria-label="Inspiration video" /> : <div className="flex h-60 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-navySoft"><span>{fmtN(r.views)} views</span><span>{fmtN(r.likes)} likes</span><span>{fmtN(r.comments)} comments</span><span>{fmtN(r.shares)} shares</span>{r.duration_s ? <span>{Math.round(r.duration_s)} s</span> : null}{r.posted_at ? <span>{r.posted_at.slice(0, 10)}</span> : null}{r.language ? <span>lang {r.language}</span> : null}
</div>
      <div className="space-y-2 rounded-2xl bg-portal-bg p-3">
        <CreateBriefButton r={r} />
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" disabled={r.status !== "analyzed"} onClick={() => void saveHook()}>Hook → library</Button>
          <Button size="sm" variant="ghost" disabled={rtBusy || !r.video_path} onClick={async () => { setRtBusy(true); try { await retx({ data: { id: r.id } }); toast.success("Re-transcribed"); onChange(); } catch (e) { toast.error((e as Error).message); } setRtBusy(false); }}>{rtBusy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Re-transcribe</Button>
          <Button size="sm" variant="ghost" asChild><a href={r.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open original</a></Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (!window.confirm("Delete this inspiration and its stored video?")) return; await del({ data: { ids: [r.id] } }); onClose?.(); onChange(); }}><Trash2 className="size-4" />Delete</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-bold text-brand-navy">Style:
          <select aria-label="Style" className="bg-transparent font-bold" value={styleOf(r) ?? ""} onChange={(e) => void upd({ approved_style: e.target.value || null })}><option value="">—</option>{ALL_STYLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-bold text-brand-navy">Notion format:
          <select aria-label="Notion format" className="bg-transparent font-bold" value={r.notion_format ?? ""} onChange={(e) => void upd({ notion_format: e.target.value || null })}><option value="">—</option>{NOTION_FORMATS.map((x) => <option key={x}>{x}</option>)}</select></label>
        {r.notion_page_id ? <a href={`https://www.notion.so/${r.notion_page_id.replace(/-/g, "")}`} target="_blank" rel="noreferrer" className="rounded-full bg-brand-navy px-2 py-1 font-bold text-card">From Notion ↗</a> : null}
      </div>
      {r.notion_notes ? <div className="rounded-lg bg-muted/60 p-2 text-sm"><p className="text-xs font-bold uppercase text-brand-navySoft">Notes (Notion)</p><p className="whitespace-pre-wrap">{r.notion_notes}</p></div> : null}
      {r.analysis ? <div className="space-y-3 text-sm text-brand-navy">
        <div><p className="text-xs font-bold uppercase text-brand-navySoft">Hook · {r.hook_type}</p><p className="font-semibold">« {r.analysis.hook.verbatim || "—"} »</p><p className="text-xs">On screen: {r.analysis.hook.on_screen || "—"} · Seen: {r.analysis.hook.visual}</p></div>
        <div><p className="text-xs font-bold uppercase text-brand-navySoft">Structure</p><ol className="space-y-1">{r.analysis.structure.map((s, i) => <li key={i}><button type="button" onClick={() => seek(s.start_s)} className="mr-2 rounded bg-muted px-1.5 font-mono text-xs font-bold text-brand-blue">{s.start_s.toFixed(1)}s</button>{s.seen}{s.said ? <span className="text-brand-navySoft"> — « {s.said} »</span> : null}{s.on_screen ? <span className="text-xs"> [{s.on_screen}]</span> : null}</li>)}</ol></div>
        <p><b>CTA:</b> {r.analysis.cta || "—"}</p>
        <p><b>Text on screen:</b> {r.analysis.on_screen_text_style} · <b>Audio:</b> {r.analysis.audio} {r.analysis.audio_note}</p>
        <div><p className="text-xs font-bold uppercase text-brand-navySoft">Why it works · {r.score}/10</p><ul className="list-disc pl-5">{r.analysis.why_it_works.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
      </div> : null}
      {r.video_path || words.length || r.transcript != null ? <div><p className="text-xs font-bold uppercase text-brand-navySoft">Transcript</p>
        {words.length ? <p className="text-sm leading-relaxed" data-testid="transcript">{words.map((w, i) => <span key={i} onClick={() => seek(w.s)} className={cn("cursor-pointer rounded", t >= w.s && t < w.e + 0.05 ? "bg-space-ugc text-card" : "")}>{w.t} </span>)}</p> : r.transcript != null ? <p className="text-sm text-brand-navySoft">{r.transcript || "No speech in this video."}</p> : null}</div> : null}
      {r.caption ? <p className="text-xs text-brand-navySoft"><b>Caption:</b> {r.caption}</p> : null}
      <p className="hidden">Cost: Apify ${Number(c["apify_usd"] ?? 0).toFixed(4)} · ElevenLabs {Number(c["stt_minutes"] ?? 0)} min (${Number(c["stt_usd"] ?? 0).toFixed(4)}) · AI {Number(c["ai_input_tokens"] ?? 0)}+{Number(c["ai_output_tokens"] ?? 0)} tokens</p>
    </div>
  );
}
