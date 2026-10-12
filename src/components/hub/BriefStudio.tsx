import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp, useApps } from "@/lib/apps";
import { studioAi } from "@/lib/brief-studio.functions";
import { STYLES, blankPlan, styleAssetIds, styleDefaults, type BriefStyle, type Plan, type StyleData } from "@/lib/brief-studio";
import { FmtPicker, PlanAssets, SnippetSlot, type LibAsset } from "./StylePickers";
import { STUDIO_DRAFT_KEY, ASSET_ROLES, BEAT_LABELS, DEFAULT_DO, DEFAULT_DONT, GESTURES, blankBrief, briefBody, scoreBrief, scriptWords, stepDone, words, type StudioBrief } from "@/lib/brief-studio";
import { BriefView, toStudio, type BriefAsset } from "./BriefPreview";
import { AssetUploader } from "./Assets";
import { InspirationReference } from "./Inspiration";
import { PostDescriptionFields } from "@/components/creators/PostDescription";
import { GuidelinesList } from "@/components/creators/Guidelines";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const input = "mt-1 block min-h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";
const EFF = [["pov", "POV"], ["reaction", "Réaction"], ["talking_head", "Face cam"]] as const;
const eur = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
const nextMonday = () => { const d = new Date(); const add = ((8 - d.getUTCDay()) % 7) || 7; d.setUTCDate(d.getUTCDate() + add); d.setUTCHours(7, 0, 0, 0); return d.toISOString(); };

function Step({ n, title, done, open, onToggle, children }: { n: number; title: string; done: boolean; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className={cn(card, "p-0")} data-testid={`studio-step-${n}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", done ? "bg-portal-green/15 text-portal-green" : "bg-brand-navy text-card")}>{done ? <Check className="size-4" /> : n}</span>
        <span className="flex-1 font-extrabold text-brand-navy">{title}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="space-y-3 border-t border-brand-line p-4">{children}</div> : null}
    </section>
  );
}

function Chips({ items, onChange, tone }: { items: string[]; onChange: (v: string[]) => void; tone: "do" | "dont" }) {
  const [v, setV] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">{items.map((x) => <span key={x} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tone === "do" ? "bg-portal-green/12 text-brand-navy" : "bg-portal-red/10 text-brand-navy")}>{x}<button type="button" aria-label={`Remove ${x}`} onClick={() => onChange(items.filter((y) => y !== x))}><X className="size-3" /></button></span>)}</div>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onChange([...items, v.trim()]); setV(""); } }}><input value={v} onChange={(e) => setV(e.target.value)} placeholder={tone === "do" ? "Ajouter un « à faire »" : "Ajouter un « à ne pas faire »"} className="h-9 flex-1 rounded-lg border px-2 text-sm" /><Button size="sm" variant="outline" type="submit">Add</Button></form>
    </div>
  );
}

export function BriefStudio({ briefId }: { briefId: string }) {
  const isNew = briefId === "new";
  const { appId } = useAdminApp();
  const { data: apps = [] } = useApps();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ai = useServerFn(studioAi);
  const [b, setB] = useState<StudioBrief | null>(null);
  const [assets, setAssets] = useState<BriefAsset[]>([]);
  const [refIds, setRefIds] = useState<string[]>([]);
  const [open, setOpen] = useState<number>(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [assign, setAssign] = useState<{ creatorId: string; date: string }>({ creatorId: "", date: "" });
  const [preview, setPreview] = useState(false);

  const { data: loaded } = useQuery({
    queryKey: ["hub", "studio", briefId],
    queryFn: async () => {
      if (isNew) return null;
      const [r, ba] = await Promise.all([
        supabase.from("briefs").select("*").eq("id", briefId).maybeSingle(),
        supabase.from("brief_assets").select("role, sort_order, assets(id, kind, title, storage_path, url, text_content, thumbnail_url)").eq("brief_id", briefId).order("sort_order"),
      ]);
      return { row: r.data, assets: (ba.data ?? []).map((x) => ({ ...(x.assets as unknown as BriefAsset), role: x.role })) };
    },
  });
  useEffect(() => {
    if (b) return;
    if (isNew) {
      const stash = typeof window !== "undefined" ? sessionStorage.getItem(STUDIO_DRAFT_KEY) : null;
      const base = blankBrief(appId ?? SOPHIA_APP_ID);
      // Removed after a beat so a dev double-mount still reads the prefilled draft.
      if (stash) { window.setTimeout(() => sessionStorage.removeItem(STUDIO_DRAFT_KEY), 1500); try { setB({ ...base, ...JSON.parse(stash) }); return; } catch { /* ignore */ } }
      setB(base); return;
    }
    if (loaded?.row) { const t = toStudio(loaded.row); setB(t.style ? { ...t, style_data: styleDefaults(t.style, t.style_data) } : t); setAssets(loaded.assets); setRefIds(loaded.row.reference_video_ids ?? []); }
  }, [loaded, isNew, appId, b]);

  const app = b?.app_id ?? SOPHIA_APP_ID;
  const { data: side } = useQuery({
    queryKey: ["hub", "studio-side", app],
    enabled: Boolean(b),
    queryFn: async () => {
      const [t, refs, cr, lib] = await Promise.all([
        supabase.from("ugc_tiers").select("tier, per_post_pov, per_post_reaction, per_post_talking_head").eq("app_id", app).eq("tier", "active").maybeSingle(),
        supabase.from("reference_videos").select("id, title, url, thumbnail_url").eq("app_id", app).eq("active", true).order("created_at", { ascending: false }).limit(200),
        supabase.from("creators").select("id, full_name, creator_apps!inner(app_id)").eq("creator_apps.app_id", app).order("full_name").limit(500),
        supabase.from("assets").select("id, kind, title, storage_path, url, text_content, thumbnail_url, role_default, folder, status, tags").eq("app_id", app).eq("status", "ready").order("created_at", { ascending: false }),
      ]);
      return { tier: t.data, refs: refs.data ?? [], creators: cr.data ?? [], library: lib.data ?? [] };
    },
  });
  const rate = (e: string | null) => { const t = side?.tier as Record<string, number> | null | undefined; return t && e ? Number(t[`per_post_${e}`] ?? 0) : null; };
  const grade = useMemo(() => (b ? scoreBrief(b, assets.length + (b.style ? styleAssetIds(b.style_data).length : 0) + refIds.length * (b.style ? 1 : 0)) : null), [b, assets.length, refIds.length]);
  const doneLegacy = b ? stepDone(b, assets.length) : [];
  // Autosave every 10 s while editing a saved draft; never changes the status.
  const bRef = useRef(b); bRef.current = b;
  const lastSaved = useRef<string>(""); const saveRef = useRef<((p?: Partial<StudioBrief>, q?: boolean) => Promise<string | null>) | null>(null);
  useEffect(() => { if (b?.id && !lastSaved.current) lastSaved.current = JSON.stringify(b); }, [b]);
  useEffect(() => { const t = window.setInterval(() => { const x = bRef.current; if (x?.id && (x.status === "draft" || x.status === "ready") && JSON.stringify(x) !== lastSaved.current) void saveRef.current?.({}, true); }, 10_000); return () => window.clearInterval(t); }, []);
  if (!b || !grade) return <p className="p-6 text-sm text-brand-navySoft">Loading the brief…</p>;
  const set = <K extends keyof StudioBrief>(k: K, v: StudioBrief[K]) => setB({ ...b, [k]: v });
  const wc = scriptWords(b);

  async function runAi(mode: "hooks" | "shorter" | "casual") {
    setBusy(mode);
    try { const r = await ai({ data: { mode, appId: app, brief: b as unknown as Record<string, unknown>, formatId: b!.parent_format_id } }); setB((x) => ({ ...x!, ...(r.patch as Partial<StudioBrief>) })); toast.success("Filled by AI — check it"); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }

  async function save(patch: Partial<StudioBrief> = {}, quiet = false): Promise<string | null> {
    const x = { ...b!, ...patch };
    if (x.status === "published" && loaded?.row?.status !== "published" && !window.confirm("Publish to creators? This is the only step that makes the brief visible to creators.")) return null;
    const row = {
      app_id: x.app_id, title: x.title || x.hook_text || "Brief sans titre", brief_type: x.brief_type, effort: x.effort, format: x.effort, platform: x.platform, duration_target: x.duration_target,
      hook_text: x.hook_text, hook: x.hook_text, hooks: [x.hook_text, x.oral_hook, x.hook_visual].filter(Boolean) as string[], oral_hook: x.oral_hook, hook_visual: x.hook_visual,
      beats: x.beats, script: x.beats.join("\n"), body: briefBody(x), product_second: x.product_second, product_gesture: x.product_gesture, product_moment: x.product_moment, say_name: x.say_name,
      must_mention: x.product_gesture ? `${x.product_gesture} à ${x.product_second ?? 5} s` : null,
      rules_do: x.rules_do, rules_dont: x.rules_dont, rules_text: x.rules_text, status: x.status, drop_at: x.drop_at, audience: x.audience === "effort" ? "all" : x.audience, audience_efforts: x.audience === "effort" ? x.audience_efforts : [],
      due_date: x.due_date, language: x.language, translation_of: x.translation_of, parent_format_id: x.parent_format_id, campaign_id: x.campaign_id,
      score: grade!.score, reference_video_ids: refIds, style: x.style, style_data: x.style_data as never,
    };
    const res = x.id ? await supabase.from("briefs").update(row as never).eq("id", x.id).select("id").single() : await supabase.from("briefs").insert(row as never).select("id").single();
    if (res.error || !res.data) { toast.error("Could not save the brief."); return null; }
    const id = res.data.id as string;
    await supabase.from("brief_assets").delete().eq("brief_id", id);
    const lib = (side?.library ?? []) as unknown as (BriefAsset & { role_default: string })[];
    const extra = styleAssetIds(x.style_data).filter((aid) => !assets.some((a) => a.id === aid)).map((aid) => lib.find((l) => l.id === aid)).filter(Boolean).map((l) => ({ ...l!, role: l!.role_default }));
    const all = [...assets, ...extra];
    if (all.length) {
      const { error } = await supabase.from("brief_assets").insert(all.map((a, i) => ({ brief_id: id, asset_id: a.id, role: a.role, sort_order: i })));
      if (error) toast.error("Files could not be attached.");
    }
    setB((cur) => ({ ...(cur ?? x), ...patch, id })); lastSaved.current = JSON.stringify({ ...x, id });
    if (x.status !== loaded?.row?.status) void qc.invalidateQueries({ queryKey: ["hub", "studio", briefId] });
    void qc.invalidateQueries({ queryKey: ["hub", "learn"] });
    if (!quiet) toast.success(x.status === "published" ? "Published" : "Saved");
    if (!b!.id) void navigate({ to: "/hub/ugc/briefs/$briefId", params: { briefId: id }, replace: true });
    return id;
  }
  saveRef.current = save;
  async function remove() {
    if (!b!.id) { void navigate({ to: "/hub/ugc/briefs" }); return; }
    if (!window.confirm(`Delete “${b!.title || "this brief"}”? This cannot be undone.`)) return;
    await supabase.from("brief_assets").delete().eq("brief_id", b!.id);
    const { error } = await supabase.from("briefs").delete().eq("id", b!.id);
    if (error) { toast.error("Could not delete the brief."); return; }
    toast.success("Brief deleted"); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); void navigate({ to: b!.brief_type === "format" ? "/hub/ugc/library" : "/hub/ugc/briefs" });
  }

  async function translate() {
    setBusy("translate");
    try {
      const id = await save({}, true); if (!id) return;
      const r = await ai({ data: { mode: "translate", appId: app, brief: b as unknown as Record<string, unknown> } });
      const p = r.patch as Partial<StudioBrief>;
      const en = { ...b!, ...p, id: "", language: "en", translation_of: id, status: "draft" };
      const { data, error } = await supabase.from("briefs").insert({ app_id: en.app_id, title: en.title, brief_type: en.brief_type, effort: en.effort, format: en.effort, platform: en.platform, duration_target: en.duration_target, hook_text: en.hook_text, hook: en.hook_text, hooks: [en.hook_text ?? ""], oral_hook: en.oral_hook, hook_visual: en.hook_visual, beats: en.beats, body: briefBody(en), product_second: en.product_second, product_gesture: en.product_gesture, product_moment: en.product_moment, say_name: en.say_name, rules_do: en.rules_do, rules_dont: en.rules_dont, rules_text: en.rules_text, status: "draft", language: "en", translation_of: id, reference_video_ids: refIds } as never).select("id").single();
      if (error || !data) throw new Error("The English version could not be saved.");
      if (assets.length) await supabase.from("brief_assets").insert(assets.map((a, i) => ({ brief_id: data.id, asset_id: a.id, role: a.role, sort_order: i })));
      toast.success("English version saved as a draft", { action: { label: "Open", onClick: () => void navigate({ to: "/hub/ugc/briefs/$briefId", params: { briefId: data.id } }) } });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }
  async function duplicate() {
    const id = await save({}, true); if (!id) return;
    const { data: src } = await supabase.from("briefs").select("*").eq("id", id).single();
    if (!src) return;
    const { id: _i, created_at: _c, ...rest } = src as Record<string, unknown>;
    const { data } = await supabase.from("briefs").insert({ ...rest, title: `${src.title} (copie)`, status: "draft" } as never).select("id").single();
    if (data) { if (assets.length) await supabase.from("brief_assets").insert(assets.map((a, i) => ({ brief_id: data.id, asset_id: a.id, role: a.role, sort_order: i }))); toast.success("Duplicated"); setB(null); void navigate({ to: "/hub/ugc/briefs/$briefId", params: { briefId: data.id } }); }
  }
  async function assignTo() {
    const id = await save({}, true); if (!id || !assign.creatorId) return;
    const { error } = await supabase.from("brief_assignments").insert({ brief_id: id, creator_id: assign.creatorId, target_date: assign.date || null, published_at: new Date().toISOString() });
    if (error) toast.error("Could not assign."); else { await supabase.from("creator_notifications").insert({ creator_id: assign.creatorId, body: `Nouveau brief pour toi : ${b!.title || b!.hook_text}` }); toast.success("Assigned"); }
  }

  const lib = (side?.library ?? []) as unknown as LibAsset[];
  const sd = b.style_data ?? {};
  const setSd = (patch: Partial<StyleData>) => setB({ ...b, style_data: { ...sd, ...patch } });
  const stylePicker = (
    <div className="grid gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Style">{STYLES.map(([k, l, hint], i) => (
      <button key={k} type="button" role="radio" aria-checked={b.style === k} onClick={() => setB({ ...b, style: k, style_data: styleDefaults(k, sd) })} className={cn("rounded-xl border p-2 text-left", b.style === k ? "border-portal-accent bg-portal-accent/10" : "")}>
        <p className="text-xs font-extrabold text-portal-accent">Style {i + 1}</p><p className="text-sm font-bold leading-tight">{l}</p><p className="mt-1 text-[11px] text-brand-navySoft">{hint}</p></button>))}</div>
  );
  const basics = <>
    {stylePicker}
    <label className="block text-sm font-semibold">Title (admin only)<input className={input} value={b.title} onChange={(e) => set("title", e.target.value)} /></label>
    <div className="grid gap-2 sm:grid-cols-3">{EFF.map(([k, l]) => <button key={k} type="button" onClick={() => set("effort", k)} className={cn("rounded-xl border p-3 text-left", b.effort === k ? "border-portal-accent bg-portal-accent/10" : "")}><p className="font-bold">{l}</p><p className="text-xs text-brand-navySoft">{rate(k) != null ? `${eur(rate(k)!)} / post (Active)` : "—"}</p></button>)}</div>
    <div className="grid gap-2 sm:grid-cols-4">
      <label className="text-sm font-semibold">App<select className={input} value={b.app_id} onChange={(e) => set("app_id", e.target.value)}>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Language<select className={input} value={b.language} onChange={(e) => set("language", e.target.value)}><option value="fr">French</option><option value="en">English</option></select></label>
      <label className="text-sm font-semibold">Platforms<select className={input} value={b.platform} onChange={(e) => set("platform", e.target.value)}><option value="both">TikTok + Instagram</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select></label>
      <label className="text-sm font-semibold">Duration target<select className={input} value={b.duration_target ?? "30s"} onChange={(e) => set("duration_target", e.target.value)}>{["7s", "10s", "15s", "20s", "30s", "45s", "60s"].map((d) => <option key={d}>{d}</option>)}</select></label>
    </div>
  </>;
  const plans = sd.plans ?? [];
  const setPlan = (i: number, patch: Partial<Plan>) => setSd({ plans: plans.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const movePlan = (i: number, dir: -1 | 1) => { const n = [...plans]; const j = i + dir; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j]!, n[i]!]; setSd({ plans: n }); };
  const ta = (label: string, v: string, on: (x: string) => void, rows = 2) => <label className="block text-xs font-semibold">{label}<textarea rows={rows} className={cn(input, "py-2")} value={v} onChange={(e) => on(e.target.value)} /></label>;
  const storyPlans = (
    <div className="space-y-3">{plans.map((p, i) => (
      <div key={i} className="space-y-2 rounded-xl border p-3" data-testid="studio-plan">
        <div className="flex items-center gap-1"><p className="flex-1 text-sm font-extrabold">Plan {i + 1}</p>
          <Button type="button" size="icon" variant="ghost" aria-label="Move up" onClick={() => movePlan(i, -1)}><ArrowUp className="size-4" /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Move down" onClick={() => movePlan(i, 1)}><ArrowDown className="size-4" /></Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Remove plan" onClick={() => setSd({ plans: plans.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button></div>
        {ta("What we see", p.do, (x) => setPlan(i, { do: x }))}
        {ta("Text on screen", p.on_screen, (x) => setPlan(i, { on_screen: x }), 1)}
        {ta("What is said", p.say, (x) => setPlan(i, { say: x }))}
        <PlanAssets value={p.assets} onChange={(v) => setPlan(i, { assets: v })} library={lib} />
        <label className="block text-xs font-semibold">Timing / framing (optional)<input className={input} value={p.camera} onChange={(e) => setPlan(i, { camera: e.target.value })} /></label>
      </div>))}
      <Button type="button" size="sm" variant="outline" onClick={() => setSd({ plans: [...plans, blankPlan()] })}><Plus className="size-4" />Add a plan</Button>
    </div>
  );
  const styleEditor: ReactNode = b.style === "reaction_demo" ? <>
    <div className="space-y-2 rounded-xl border p-3"><p className="text-sm font-extrabold">Plan 1 · Face (camera on your face)</p>
      {ta("La réaction à faire", plans[0]?.reaction ?? "", (x) => setPlan(0, { reaction: x }))}
      {ta("Le texte à mettre", plans[0]?.on_screen ?? "", (x) => setPlan(0, { on_screen: x }), 1)}
      <FmtPicker value={plans[0]?.fmt ?? { kind: "subtitle", note: "" }} onChange={(v) => setPlan(0, { fmt: v })} />
      {ta("Ce qu'il faut dire", plans[0]?.say ?? "", (x) => setPlan(0, { say: x }))}</div>
    <div className="space-y-2 rounded-xl border p-3"><p className="text-sm font-extrabold">Plan 2 · Téléphone / démo (camera on the phone)</p>
      {ta("Ce qu'il faut faire (step by step in the app)", plans[1]?.do ?? "", (x) => setPlan(1, { do: x }), 4)}
      {ta("Ce qu'il faut dire", plans[1]?.say ?? "", (x) => setPlan(1, { say: x }))}</div>
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sd.flips?.on ?? false} onChange={(e) => setSd({ flips: { on: e.target.checked, note: sd.flips?.note ?? "" } })} />Retournements de caméra (camera flips)</label>
    {sd.flips?.on ? <input aria-label="Where the flips happen" className={input} placeholder="Where the flips happen" value={sd.flips.note} onChange={(e) => setSd({ flips: { on: true, note: e.target.value } })} /> : null}
  </> : b.style === "broll_stickers" ? storyPlans : b.style === "sole_footage" && sd.sole ? (() => { const x = sd.sole; const up = (p: Partial<typeof x>) => setSd({ sole: { ...x, ...p } }); return <>
    {ta("What is on the plan", x.what, (v) => up({ what: v }), 3)}
    <label className="block text-xs font-semibold">Duration (seconds)<input type="number" min={1} max={60} className={input} value={x.duration_s ?? ""} onChange={(e) => up({ duration_s: e.target.value ? Number(e.target.value) : null })} /></label>
    <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold">Music title<input className={input} value={x.music_title} onChange={(e) => up({ music_title: e.target.value })} /></label><label className="text-xs font-semibold">Music link<input className={input} value={x.music_link} onChange={(e) => up({ music_link: e.target.value })} placeholder="https://" /></label></div>
    <PlanAssets single label="Or an audio file from the library" value={x.music_asset_id ? [{ asset_id: x.music_asset_id, when: "" }] : []} onChange={(v) => up({ music_asset_id: v[0]?.asset_id ?? null })} library={lib.filter((a) => a.kind === "audio")} />
    {ta("Text to put on screen", x.text, (v) => up({ text: v }), 1)}
    <FmtPicker value={x.fmt} onChange={(v) => up({ fmt: v })} />
  </>; })() : b.style === "talked_hook_demo" && sd.demo ? (() => { const dm = sd.demo; const up = (p: Partial<typeof dm>) => setSd({ demo: { ...dm, ...p } }); return <>
    {storyPlans}
    <div className="space-y-2 rounded-xl border-2 border-portal-accent/30 p-3"><p className="text-sm font-extrabold">Demo plan</p>
      <div className="flex gap-2">{([["filmed", "Demo filmed by the creator"], ["asset", "Demo = a screen recording"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => up({ mode: k })} className={cn("min-h-9 rounded-full border px-3 text-xs font-bold", dm.mode === k ? "border-brand-navy bg-brand-navy text-card" : "")}>{l}</button>)}</div>
      {dm.mode === "filmed" ? ta("What to do", dm.do, (v) => up({ do: v }), 3) : <PlanAssets single label="Screen recording + when to show it" value={dm.asset ? [dm.asset] : []} onChange={(v) => up({ asset: v[0] ?? null })} library={lib.filter((a) => a.kind === "video" || a.folder === "screen_recordings")} />}
      {ta(dm.mode === "asset" ? "What to say over it" : "What to say", dm.say, (v) => up({ say: v }))}
    </div>
  </>; })() : b.style === "educational" ? <>
    {ta("The script (long, talked)", sd.script ?? "", (v) => setSd({ script: v }), 12)}
    <p className="text-xs text-brand-navySoft">{words(sd.script)} words · line breaks are kept for the creator.</p>
    <FmtPicker value={sd.script_fmt ?? { kind: "subtitle", note: "" }} onChange={(v) => setSd({ script_fmt: v })} />
    <PlanAssets label="Assets to flash on screen (optional)" value={sd.flashes ?? []} onChange={(v) => setSd({ flashes: v })} library={lib} />
  </> : <p className="text-sm text-brand-navySoft">Choose a style first.</p>;

  const pay = rate(b.effort) != null ? `${eur(rate(b.effort)!)} / post` : null;
  const dirty = JSON.stringify(b) !== lastSaved.current;
  const inspirationId = (loaded?.row as { inspiration_id?: string | null } | null | undefined)?.inspiration_id ?? null;
  const previewAssets = [...assets, ...styleAssetIds(sd).filter((id) => !assets.some((a) => a.id === id)).map((id) => (side?.library ?? []).find((l) => l.id === id)).filter(Boolean).map((l) => ({ ...(l as unknown as BriefAsset), role: (l as { role_default: string }).role_default }))];
  async function saveAsFormat() {
    const id = await save({}, true); if (!id) return;
    const { data: src } = await supabase.from("briefs").select("*").eq("id", id).single(); if (!src) return;
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = src as Record<string, unknown>; void _i; void _c; void _u;
    const { error } = await supabase.from("briefs").insert({ ...rest, brief_type: "format", status: "draft", drop_at: null, inspiration_id: null, title: String(src.title || "Format") } as never);
    if (error) toast.error("Could not save the format."); else { toast.success("Saved in Library → Formats"); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); }
  }
  const sec = (title: string, body: ReactNode, extra?: ReactNode) => <section className={cn(card, "space-y-3")}><div className="flex items-center justify-between gap-2"><h2 className="font-extrabold text-brand-navy">{title}</h2>{extra}</div>{body}</section>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/hub/ugc/briefs" className="text-sm font-semibold text-portal-accent">← Briefs</Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold text-brand-navy">{b.title || "New brief"}{b.brief_type === "format" ? " · format" : ""}</h1>
        <span className="text-xs font-semibold text-brand-navySoft" data-testid="autosave">{!b.id ? "Not saved yet" : dirty ? (b.status === "draft" ? "Unsaved · autosaves in a few seconds" : "Unsaved changes") : "Saved"}</span>
        <Button variant="outline" onClick={() => void save()}>Save</Button>
        {b.status === "draft" ? <Button variant="outline" onClick={() => void save({ status: "ready" })}>Mark ready</Button> : null}
        {b.status !== "published" && b.status !== "archived" && b.brief_type !== "format" ? <Button onClick={() => void save({ status: "published" })}>Publish to creators</Button> : null}
        <Button variant="outline" onClick={() => setPreview(true)}>Preview as creator</Button>
        <details className="relative"><summary className="flex h-9 cursor-pointer list-none items-center rounded-md border px-3 text-sm font-bold" aria-label="More actions">⋯</summary>
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border bg-card p-1 shadow-portal">
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-portal-bg" onClick={() => void duplicate()}>Duplicate</button>
            {b.brief_type !== "format" ? <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-portal-bg" onClick={() => void saveAsFormat()}>Save as format</button> : null}
            <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-portal-bg" onClick={async () => { if (window.confirm("Archive this brief?")) { await save({ status: "archived" }); void navigate({ to: "/hub/ugc/briefs" }); } }}>Archive</button>
            {b.status !== "published" ? <button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-portal-red hover:bg-portal-bg" onClick={() => void remove()}>Delete</button> : null}
          </div></details>
      </div>
      <div className={cn("grid gap-6", inspirationId && "lg:grid-cols-[1fr_380px]")}>
        <div className="min-w-0 space-y-4">
          {sec("Title, app & style", <>
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_140px]">
              <label className="text-sm font-semibold">Title (admin only)<input className={input} value={b.title} onChange={(e) => set("title", e.target.value)} /></label>
              <label className="text-sm font-semibold">App<select className={input} value={b.app_id} onChange={(e) => set("app_id", e.target.value)}>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
              <label className="text-sm font-semibold">Language<select className={input} value={b.language} onChange={(e) => set("language", e.target.value)}><option value="fr">French</option><option value="en">English</option></select></label>
            </div>
            {stylePicker}
          </>)}
          {sec("Hook", <>
            <SnippetSlot kind="hook" label="On screen (frame 1)" value={b.hook_text ?? ""} onChange={(v) => set("hook_text", v)} appId={app} style={b.style} language={b.language} rows={1} />
            <label className="block text-sm font-semibold">Oral (first sentence said)<input className={input} value={b.oral_hook ?? ""} onChange={(e) => set("oral_hook", e.target.value)} /></label>
          </>)}
          {sec(b.style === "educational" ? "Plan · script" : "Plan", styleEditor)}
          {sec("Product moment", <>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
              <label className="block text-sm font-semibold">At second <b>{b.product_second ?? 5}</b><input type="range" min={1} max={30} value={b.product_second ?? 5} onChange={(e) => set("product_second", Number(e.target.value))} className="mt-3 w-full" aria-label="Product second" /></label>
              <label className="block text-sm font-semibold">Gesture<select className={input} value={GESTURES.includes(b.product_gesture as never) ? b.product_gesture! : "Autre"} onChange={(e) => set("product_gesture", e.target.value === "Autre" ? "" : e.target.value)}>{GESTURES.map((g) => <option key={g}>{g}</option>)}</select></label>
            </div>
            <label className="block text-sm font-semibold">What happens<input className={input} value={b.product_moment ?? ""} onChange={(e) => set("product_moment", e.target.value)} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={b.say_name} onChange={(e) => set("say_name", e.target.checked)} />Say the app name</label>
          </>)}
          {sec("CTA", <SnippetSlot kind="cta" label="CTA" value={sd.cta ?? ""} onChange={(v) => setSd({ cta: v })} appId={app} style={b.style} language={b.language} rows={1} />)}
          {sec("Shooting rules", <GuidelinesList appId={app} en={b.language === "en"} />, <Link to="/hub/settings" search={{ tab: "ugc-guidelines" }} className="text-xs font-bold text-portal-accent">Edit rules →</Link>)}
          {sec("Description to paste", <div data-testid="studio-post-desc"><p className="mb-2 text-xs text-brand-navySoft">Leave empty to use the app default (Settings → Post descriptions).</p>
            <PostDescriptionFields value={b.style_data?.post_desc ?? {}} onChange={(v) => set("style_data", { ...(b.style_data ?? {}), post_desc: v })} /></div>)}
        </div>
        {inspirationId ? <aside className="lg:sticky lg:top-4 lg:self-start"><InspirationReference id={inspirationId} /></aside> : null}
      </div>
      <Sheet open={preview} onOpenChange={setPreview}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Preview as creator</SheetTitle></SheetHeader>
          <div className="mt-3 rounded-[1.6rem] border-[8px] border-brand-navy bg-card p-3"><BriefView b={b} assets={previewAssets} refs={(side?.refs ?? []).filter((r) => refIds.includes(r.id))} pay={pay} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
