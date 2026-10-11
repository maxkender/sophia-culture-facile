import { useEffect, useMemo, useState, type ReactNode } from "react";
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
      if (stash) { sessionStorage.removeItem(STUDIO_DRAFT_KEY); try { setB({ ...base, ...JSON.parse(stash) }); return; } catch { /* ignore */ } }
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
    if (x.status === "published" && grade!.score < 8 && !window.confirm(`Score ${grade!.score}/10 — publishing is allowed from 8. Publish anyway?`)) return null;
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
    setB({ ...x, id });
    void qc.invalidateQueries({ queryKey: ["hub", "learn"] });
    if (!quiet) toast.success(x.status === "published" ? "Published" : "Saved");
    if (!b!.id) void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: id }, replace: true });
    return id;
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
      toast.success("English version saved as a draft", { action: { label: "Open", onClick: () => void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: data.id } }) } });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }
  async function duplicate() {
    const id = await save({}, true); if (!id) return;
    const { data: src } = await supabase.from("briefs").select("*").eq("id", id).single();
    if (!src) return;
    const { id: _i, created_at: _c, ...rest } = src as Record<string, unknown>;
    const { data } = await supabase.from("briefs").insert({ ...rest, title: `${src.title} (copie)`, status: "draft" } as never).select("id").single();
    if (data) { if (assets.length) await supabase.from("brief_assets").insert(assets.map((a, i) => ({ brief_id: data.id, asset_id: a.id, role: a.role, sort_order: i }))); toast.success("Duplicated"); setB(null); void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: data.id } }); }
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
        {ta("Texte à l'écran", p.on_screen, (x) => setPlan(i, { on_screen: x }), 1)}
        {ta("Texte à dire", p.say, (x) => setPlan(i, { say: x }))}
        <PlanAssets value={p.assets} onChange={(v) => setPlan(i, { assets: v })} library={lib} />
        <label className="block text-xs font-semibold">Plan caméra (optional)<input className={input} value={p.camera} onChange={(e) => setPlan(i, { camera: e.target.value })} /></label>
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

  const oldSteps: [string, ReactNode][] = [
    ["Type & format", <>
      {stylePicker}
      <label className="block text-sm font-semibold">Title (admin only)<input className={input} value={b.title} onChange={(e) => set("title", e.target.value)} /></label>
      <div className="flex flex-wrap gap-2">{(["precise", "format"] as const).map((t) => <button key={t} type="button" onClick={() => set("brief_type", t)} className={cn("min-h-10 rounded-full border px-4 text-sm font-bold", b.brief_type === t ? "border-brand-navy bg-brand-navy text-card" : "")}>{t === "precise" ? "Brief précis" : "Format (répétable)"}</button>)}</div>
      <div className="grid gap-2 sm:grid-cols-3">{EFF.map(([k, l]) => <button key={k} type="button" onClick={() => set("effort", k)} className={cn("rounded-xl border p-3 text-left", b.effort === k ? "border-portal-accent bg-portal-accent/10" : "")}><p className="font-bold">{l}</p><p className="text-xs text-brand-navySoft">{rate(k) != null ? `${eur(rate(k)!)} / post (Active)` : "—"}</p></button>)}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-sm font-semibold">App<select className={input} value={b.app_id} onChange={(e) => set("app_id", e.target.value)}>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Platforms<select className={input} value={b.platform} onChange={(e) => set("platform", e.target.value)}><option value="both">TikTok + Instagram</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option></select></label>
        <label className="text-sm font-semibold">Duration target<select className={input} value={b.duration_target ?? "30s"} onChange={(e) => set("duration_target", e.target.value)}>{["15s", "20s", "30s", "45s", "60s"].map((d) => <option key={d}>{d}</option>)}</select></label>
      </div>
    </>],
    ["Hook", <>
      <label className="block text-sm font-semibold">On screen (frame 1, 5 words max) <span className={cn("ml-1 text-xs", words(b.hook_text) > 5 ? "text-portal-red" : "text-brand-navySoft")}>{words(b.hook_text)}/5</span><input className={input} value={b.hook_text ?? ""} onChange={(e) => set("hook_text", e.target.value)} /></label>
      <label className="block text-sm font-semibold">Oral (first sentence)<input className={input} value={b.oral_hook ?? ""} onChange={(e) => set("oral_hook", e.target.value)} /></label>
      <label className="block text-sm font-semibold">Visual (what we see)<input className={input} value={b.hook_visual ?? ""} onChange={(e) => set("hook_visual", e.target.value)} /></label>
      <Button variant="outline" size="sm" disabled={busy === "hooks"} onClick={() => void runAi("hooks")}><Sparkles className="size-4" />{busy === "hooks" ? "Writing…" : "Suggest 3 hooks"}</Button>
    </>],
    ["Script in 3 beats", <>
      {BEAT_LABELS.map((l, i) => <label key={l} className="block text-sm font-semibold">{l}<textarea rows={3} className={cn(input, "py-2")} value={b.beats[i] ?? ""} onChange={(e) => { const nb = [...b.beats]; nb[i] = e.target.value; set("beats", nb); }} /></label>)}
      <p className={cn("text-sm font-bold", wc > 140 ? "text-portal-red" : wc >= 110 ? "text-portal-amber" : "text-portal-green")}>{wc} words · target under 110{wc > 140 ? " — too long, it will not hold 30 s" : ""}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void runAi("shorter")}><Sparkles className="size-4" />{busy === "shorter" ? "Writing…" : "Rewrite shorter"}</Button>
        <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void runAi("casual")}><Sparkles className="size-4" />{busy === "casual" ? "Writing…" : "Rewrite more casual (18-25)"}</Button>
      </div>
    </>],
    ["Product moment", <>
      <label className="block text-sm font-semibold">At second <b>{b.product_second ?? 5}</b><input type="range" min={3} max={15} value={b.product_second ?? 5} onChange={(e) => set("product_second", Number(e.target.value))} className="mt-2 w-full" aria-label="Product second" /></label>
      <label className="block text-sm font-semibold">Gesture<select className={input} value={GESTURES.includes(b.product_gesture as never) ? b.product_gesture! : "Autre"} onChange={(e) => set("product_gesture", e.target.value === "Autre" ? "" : e.target.value)}>{GESTURES.map((g) => <option key={g}>{g}</option>)}</select></label>
      {!GESTURES.includes(b.product_gesture as never) ? <input aria-label="Custom gesture" className={input} placeholder="Describe the gesture" value={b.product_gesture ?? ""} onChange={(e) => set("product_gesture", e.target.value)} /> : null}
      <label className="block text-sm font-semibold">Notes<input className={input} value={b.product_moment ?? ""} onChange={(e) => set("product_moment", e.target.value)} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={b.say_name} onChange={(e) => set("say_name", e.target.checked)} />Say the app name at the end</label>
    </>],
    ["Assets", <>
      {assets.length ? <ul className="space-y-2">{assets.map((a, i) => (
        <li key={a.id} className="flex items-center gap-2 rounded-xl border p-2 text-sm"><span className="min-w-0 flex-1 truncate font-semibold">{a.title}</span>
          <select aria-label="Role" value={a.role} onChange={(e) => setAssets(assets.map((y, j) => (j === i ? { ...y, role: e.target.value } : y)))} className="h-8 rounded-lg border px-1 text-xs">{ASSET_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => setAssets(assets.filter((_, j) => j !== i))}><X className="size-4" /></Button></li>
      ))}</ul> : <p className="text-sm text-brand-navySoft">No file yet.</p>}
      <label className="block text-sm font-semibold">Attach from the library
        <select aria-label="Attach from library" className={input} value="" onChange={(e) => { const a = side?.library.find((x) => x.id === e.target.value); if (a && !assets.some((y) => y.id === a.id)) setAssets([...assets, { ...(a as unknown as BriefAsset), role: a.role_default }]); }}>
          <option value="">Choose a file…</option>{(side?.library ?? []).filter((a) => !assets.some((y) => y.id === a.id)).map((a) => <option key={a.id} value={a.id}>{a.title} · {a.kind}</option>)}
        </select>
      </label>
      <AssetUploader appId={app} onDone={(a) => setAssets((x) => [...x, a])} compact />
      <fieldset><legend className="text-sm font-semibold">Reference videos</legend>
        <div className="mt-1 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{(side?.refs ?? []).map((r) => { const on = refIds.includes(r.id); return <button type="button" key={r.id} onClick={() => setRefIds(on ? refIds.filter((x) => x !== r.id) : [...refIds, r.id])} className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-portal-accent bg-portal-accent/10 text-portal-accent" : "")}>{r.title || r.url.slice(0, 40)}</button>; })}</div>
      </fieldset>
    </>],
    ["Rules", <>
      <p className="text-xs font-bold uppercase text-brand-navySoft">Do</p><Chips items={b.rules_do} onChange={(v) => set("rules_do", v)} tone="do" />
      <p className="text-xs font-bold uppercase text-brand-navySoft">Don't</p><Chips items={b.rules_dont} onChange={(v) => set("rules_dont", v)} tone="dont" />
      <Button size="sm" variant="ghost" onClick={() => setB({ ...b, rules_do: [...new Set([...b.rules_do, ...DEFAULT_DO])], rules_dont: [...new Set([...b.rules_dont, ...DEFAULT_DONT])] })}>Reset to app defaults</Button>
      <label className="block text-sm font-semibold">Free text<textarea rows={2} className={cn(input, "py-2")} value={b.rules_text ?? ""} onChange={(e) => set("rules_text", e.target.value)} /></label>
    </>],
    ["Publish", <>
      <div className="flex flex-wrap gap-2">{([["draft", "Draft"], ["scheduled", "Monday drop"], ["published", "Published"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setB({ ...b, status: k, drop_at: k === "scheduled" ? nextMonday() : b.drop_at })} className={cn("min-h-10 rounded-full border px-4 text-sm font-bold", b.status === k ? "border-brand-navy bg-brand-navy text-card" : "")}>{l}</button>)}</div>
      {b.status === "scheduled" && b.drop_at ? <p className="text-xs text-brand-navySoft">Drops {new Date(b.drop_at).toLocaleString()}</p> : null}
      <label className="block text-sm font-semibold">Audience<select className={input} value={b.audience_efforts.length ? "effort" : b.audience} onChange={(e) => setB({ ...b, audience: e.target.value, audience_efforts: e.target.value === "effort" ? ["talking_head"] : [] })}><option value="all">All creators</option><option value="selected">Selected creators only (assign below)</option><option value="effort">By effort</option></select></label>
      {b.audience === "effort" || b.audience_efforts.length ? <div className="flex gap-2">{EFF.map(([k, l]) => <label key={k} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={b.audience_efforts.includes(k)} onChange={(e) => set("audience_efforts", e.target.checked ? [...b.audience_efforts, k] : b.audience_efforts.filter((x) => x !== k))} />{l}</label>)}</div> : null}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <select aria-label="Assign to creator" className={input} value={assign.creatorId} onChange={(e) => setAssign({ ...assign, creatorId: e.target.value })}><option value="">Assign to a creator…</option>{(side?.creators ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
        <input type="date" aria-label="Target date" className={input} value={assign.date} onChange={(e) => setAssign({ ...assign, date: e.target.value })} />
        <Button variant="outline" className="mt-1" disabled={!assign.creatorId} onClick={() => void assignTo()}>Assign</Button>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={() => void save()}>{b.status === "published" ? "Publish" : b.status === "scheduled" ? "Schedule" : "Save draft"}</Button>
        <Button variant="outline" disabled={busy === "translate"} onClick={() => void translate()}><Sparkles className="size-4" />{busy === "translate" ? "Translating…" : "Translate to EN"}</Button>
        <Button variant="outline" onClick={() => void duplicate()}>Duplicate</Button>
        <Button variant="ghost" onClick={async () => { if (window.confirm("Archive this brief?")) { await save({ status: "archived" }); void navigate({ to: "/hub/ugc/library" }); } }}>Archive</Button>
      </div>
    </>],
  ];
  const filesStep = oldSteps[4]!; const rulesStep = oldSteps[5]!; const publishStep = oldSteps[6]!;
  const steps: [string, ReactNode][] = b.style ? [
    ["Style & basics", basics],
    ["Hook · Body · CTA", <>
      <SnippetSlot kind="hook" label="Hook (frame 1)" value={b.hook_text ?? ""} onChange={(v) => set("hook_text", v)} appId={app} style={b.style} language={b.language} rows={1} />
      <SnippetSlot kind="body" label="Body (the idea in one or two lines)" value={sd.body ?? ""} onChange={(v) => setSd({ body: v })} appId={app} style={b.style} language={b.language} />
      <SnippetSlot kind="cta" label="CTA" value={sd.cta ?? ""} onChange={(v) => setSd({ cta: v })} appId={app} style={b.style} language={b.language} rows={1} />
    </>],
    [b.style === "educational" ? "Script" : b.style === "sole_footage" ? "The plan" : "Plans", styleEditor],
    filesStep, rulesStep, publishStep,
  ] : oldSteps;
  const done = b.style ? [Boolean(b.title.trim() && b.effort), Boolean(b.hook_text?.trim() && sd.cta?.trim()), grade.missing.filter((m) => /Plan|plan|Script|Demo|music|Music|Duration|Text on screen|asset placed|timing|flips|reaction/i.test(m)).length === 0, assets.length + styleAssetIds(sd).length > 0, b.rules_do.length + b.rules_dont.length > 0, b.status !== "draft"] : doneLegacy;
  const doneCount = done.filter(Boolean).length;
  const pay = rate(b.effort) != null ? `${eur(rate(b.effort)!)} / post` : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/hub/ugc/library" className="text-sm font-semibold text-portal-accent">← Library</Link>
        <h1 className="flex-1 text-xl font-extrabold text-brand-navy">Brief Studio{b.language === "en" ? " · EN" : ""}</h1>
        <span className="rounded-full bg-portal-bg px-3 py-1 text-sm font-bold" data-testid="studio-progress">{doneCount}/{steps.length}</span>
        {b.style ? <span className="rounded-full bg-portal-accent/15 px-3 py-1 text-xs font-extrabold text-portal-accent">Style {STYLES.findIndex(([k]) => k === b.style) + 1}</span> : null}
        <span title={grade.missing.join("\n")} data-testid="studio-score" className={cn("rounded-full px-3 py-1 text-sm font-extrabold", grade.score >= 8 ? "bg-portal-green/15 text-portal-green" : "bg-portal-amber/20 text-brand-navy")}>Score {grade.score}/10</span>
        <Button onClick={() => void save()}>Save</Button>
      </div>
      {grade.missing.length ? <details className={cn(card, "py-3 text-sm")}><summary className="cursor-pointer font-bold text-brand-navy">{grade.score >= 8 ? "Ready to publish" : "Publishing is allowed from 8/10"} — {grade.missing.length} point{grade.missing.length > 1 ? "s" : ""} missing</summary><ul className="mt-2 list-disc pl-5 text-brand-navySoft">{grade.missing.map((m) => <li key={m}>{m}</li>)}</ul></details> : null}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start"><p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-brand-navySoft">Preview as creator</p>
          <div className="mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[10px] border-brand-navy bg-portal-bg p-3 shadow-portal">
            <div className="max-h-[70vh] overflow-y-auto rounded-[1.6rem] bg-card p-3"><BriefView b={b} assets={[...assets, ...styleAssetIds(sd).filter((id) => !assets.some((a) => a.id === id)).map((id) => (side?.library ?? []).find((l) => l.id === id)).filter(Boolean).map((l) => ({ ...(l as unknown as BriefAsset), role: (l as { role_default: string }).role_default }))]} refs={(side?.refs ?? []).filter((r) => refIds.includes(r.id))} pay={pay} /></div>
          </div>
        </aside>
        <div className="space-y-3">{steps.map(([t, body], i) => <Step key={t} n={i + 1} title={t} done={done[i] ?? false} open={open === i + 1} onToggle={() => setOpen(open === i + 1 ? 0 : i + 1)}>{body}</Step>)}</div>
      </div>
    </div>
  );
}
