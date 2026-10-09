import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { generateBriefsFromCourses } from "@/lib/hub-learn.functions";
import { PostThumb } from "./PostThumb";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const input = "mt-1 block min-h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";
const TABS = ["Briefs", "Reference videos", "Guides & rules", "Templates"] as const;
const FORMATS = ["talking_head", "pov", "reaction", "voiceover", "skit", "green_screen", "list"];

/** Next Monday 09:00 Paris (07:00 or 08:00 UTC depending on DST; stored as 07:00 UTC so the 09:00 Paris run always picks it up). */
function nextMonday() {
  const d = new Date(); const add = ((8 - d.getUTCDay()) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + add); d.setUTCHours(7, 0, 0, 0); return d;
}

type Brief = { id: string; title: string; hooks: string[]; hook: string | null; angle: string | null; script: string | null; body: string; must_mention: string | null; format: string | null; duration_target: string | null; difficulty: number; reference_video_ids: string[]; status: string; drop_at: string | null; app_id: string };

function BriefEditor({ b, refs, onClose }: { b: Brief; refs: { id: string; title: string | null; url: string }[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState(b);
  const hooks = [0, 1, 2].map((i) => f.hooks[i] ?? (i === 0 ? f.hook ?? "" : ""));
  async function save(extra: Partial<Brief> = {}) {
    const row = { ...f, ...extra, hooks: hooks.filter(Boolean), hook: hooks[0] || null, body: f.script ?? f.body ?? "" };
    const { id, ...rest } = row;
    const { error } = id ? await supabase.from("briefs").update(rest).eq("id", id) : await supabase.from("briefs").insert(rest);
    if (error) { toast.error("Could not save the brief."); return; }
    toast.success("Brief saved"); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); onClose();
  }
  return (
    <div className={cn(card, "space-y-3")}>
      <label className="block text-sm font-semibold">Title<input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <div className="grid gap-2 md:grid-cols-3">{hooks.map((h, i) => <label key={i} className="text-sm font-semibold">Hook {i + 1}<input className={input} value={h} onChange={(e) => { const n = [...hooks]; n[i] = e.target.value; setF({ ...f, hooks: n }); }} /></label>)}</div>
      <label className="block text-sm font-semibold">Angle<input className={input} value={f.angle ?? ""} onChange={(e) => setF({ ...f, angle: e.target.value })} /></label>
      <label className="block text-sm font-semibold">Script<textarea rows={6} className={cn(input, "py-2")} value={f.script ?? ""} onChange={(e) => setF({ ...f, script: e.target.value })} /></label>
      <label className="block text-sm font-semibold">Must mention<input className={input} value={f.must_mention ?? ""} onChange={(e) => setF({ ...f, must_mention: e.target.value })} /></label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-sm font-semibold">Format<select className={input} value={f.format ?? ""} onChange={(e) => setF({ ...f, format: e.target.value })}><option value="">—</option>{FORMATS.map((x) => <option key={x} value={x}>{x.replace("_", " ")}</option>)}</select></label>
        <label className="text-sm font-semibold">Duration<input className={input} placeholder="30s" value={f.duration_target ?? ""} onChange={(e) => setF({ ...f, duration_target: e.target.value })} /></label>
        <label className="text-sm font-semibold">Difficulty<select className={input} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })}><option value={1}>Easy</option><option value={2}>Medium</option><option value={3}>Hard</option></select></label>
      </div>
      <fieldset><legend className="text-sm font-semibold">References</legend>
        <div className="mt-1 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{refs.map((r) => {
          const on = f.reference_video_ids.includes(r.id);
          return <button type="button" key={r.id} onClick={() => setF({ ...f, reference_video_ids: on ? f.reference_video_ids.filter((x) => x !== r.id) : [...f.reference_video_ids, r.id] })} className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-portal-accent bg-portal-accent/10 text-portal-accent" : "")}>{r.title || r.url.slice(0, 40)}</button>;
        })}</div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save()}>Save draft</Button>
        <Button variant="outline" onClick={() => void save({ status: "scheduled", drop_at: nextMonday().toISOString() })}>Add to Monday drop</Button>
        <Button variant="outline" onClick={() => void save({ status: "published" })}>Publish now</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function Briefs() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient();
  const gen = useServerFn(generateBriefsFromCourses);
  const [edit, setEdit] = useState<Brief | null>(null);
  const [n, setN] = useState(3);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [status, setStatus] = useState("all");
  const { data } = useQuery({
    queryKey: ["hub", "learn", "briefs", app],
    queryFn: async () => {
      const [b, r] = await Promise.all([
        supabase.from("briefs").select("*").eq("app_id", app).order("created_at", { ascending: false }).limit(500),
        supabase.from("reference_videos").select("id, title, url").eq("app_id", app).eq("active", true),
      ]);
      return { briefs: (b.data ?? []) as unknown as Brief[], refs: r.data ?? [] };
    },
  });
  const briefs = (data?.briefs ?? []).filter((b) => status === "all" || b.status === status);
  async function schedule() {
    const { error } = await supabase.from("briefs").update({ status: "scheduled", drop_at: nextMonday().toISOString() }).in("id", sel);
    if (error) toast.error("Could not schedule."); else { toast.success(`${sel.length} briefs drop ${nextMonday().toLocaleString()}`); setSel([]); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); }
  }
  const blank: Brief = { id: "", title: "", hooks: [], hook: null, angle: "", script: "", body: "", must_mention: "", format: "talking_head", duration_target: "30s", difficulty: 1, reference_video_ids: [], status: "draft", drop_at: null, app_id: app };
  if (edit) return <BriefEditor b={edit} refs={data?.refs ?? []} onClose={() => setEdit(null)} />;
  return (
    <div className="space-y-4">
      <div className={cn(card, "flex flex-wrap items-end gap-3")}>
        <Button onClick={() => setEdit(blank)}>New brief</Button>
        <label className="text-xs font-semibold text-brand-navySoft">Courses<input type="number" min={1} max={20} value={n} onChange={(e) => setN(Math.min(20, Math.max(1, Number(e.target.value))))} className="mt-1 block h-10 w-20 rounded-xl border px-2" /></label>
        <Button variant="outline" disabled={busy} onClick={async () => {
          setBusy(true);
          try { const r = await gen({ data: { count: n, appId: app, language: "fr" } }); toast[r.errors.length ? "warning" : "success"](`${r.created} draft briefs from ${r.courses} courses${r.errors.length ? ` — ${r.errors[0]}` : ""}`); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); void qc.refetchQueries({ queryKey: ["hub", "learn", "briefs"] }); setStatus("all"); }
          catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
        }}><Sparkles className="size-4" />{busy ? "Writing…" : "Generate from courses"}</Button>
        <Button variant="outline" disabled={!sel.length} onClick={() => void schedule()}>Drop selected on Monday 09:00 ({sel.length})</Button>
        <select aria-label="Status" className="ml-auto h-10 rounded-xl border px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>{["all", "draft", "scheduled", "published", "archived"].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {briefs.length === 0 ? <p className={cn(card, "text-sm text-brand-navySoft")}>No briefs here yet.</p> : (
        <div className="grid gap-3 md:grid-cols-2">{briefs.map((b) => (
          <div key={b.id} className={cn(card, "flex gap-3")}>
            <input type="checkbox" aria-label={`Select ${b.title}`} checked={sel.includes(b.id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, b.id] : s.filter((x) => x !== b.id)))} />
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEdit(b)}>
              <p className="font-extrabold text-brand-navy">{b.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-brand-navySoft">{b.hooks?.[0] ?? b.hook ?? b.angle}</p>
              <p className="mt-2 text-xs text-brand-navySoft"><span className="rounded-full bg-portal-bg px-2 py-0.5 font-bold">{b.status}</span>{b.drop_at && b.status === "scheduled" ? ` · drops ${new Date(b.drop_at).toLocaleDateString()}` : ""} · {b.format ?? "—"} · {b.duration_target ?? ""}</p>
            </button>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function References() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const { data = [] } = useQuery({ queryKey: ["hub", "learn", "refs", app], queryFn: async () => (await supabase.from("reference_videos").select("*").eq("app_id", app).order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [] });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "learn", "refs"] });
  async function add() {
    const u = url.trim(); if (!/^https:\/\/(www\.)?(tiktok|instagram)\.com\//.test(u)) { toast.error("Paste a TikTok or Instagram video link."); return; }
    const { error } = await supabase.from("reference_videos").insert({ url: u, platform: u.includes("tiktok") ? "tiktok" : "instagram", app_id: app });
    if (error) toast.error("Could not add."); else { setUrl(""); reload(); }
  }
  return (
    <div className="space-y-4">
      <div className={cn(card, "flex gap-2")}><input aria-label="Video link" className="min-h-10 flex-1 rounded-xl border px-3 text-sm" placeholder="https://www.tiktok.com/@…/video/…" value={url} onChange={(e) => setUrl(e.target.value)} /><Button onClick={() => void add()}>Add</Button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.map((r) => (
        <div key={r.id} className={cn(card, "space-y-2 p-3", !r.active && "opacity-50")}>
          <a href={r.url} target="_blank" rel="noreferrer"><PostThumb url={r.url} className="aspect-[9/16] w-full rounded-xl object-cover" /></a>
          <input aria-label="Title" defaultValue={r.title ?? ""} placeholder="Title" onBlur={(e) => void supabase.from("reference_videos").update({ title: e.target.value }).eq("id", r.id)} className="h-9 w-full rounded-lg border px-2 text-sm" />
          <input aria-label="Tags" defaultValue={(r.tags ?? []).join(", ")} placeholder="tags, comma separated" onBlur={(e) => void supabase.from("reference_videos").update({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }).eq("id", r.id).then(reload)} className="h-9 w-full rounded-lg border px-2 text-xs" />
          <div className="flex gap-1">
            <Button size="sm" variant={r.is_winner ? "default" : "outline"} onClick={() => void supabase.from("reference_videos").update({ is_winner: !r.is_winner }).eq("id", r.id).then(reload)}><Star className="size-3.5" />Winner</Button>
            <Button size="sm" variant="outline" onClick={() => void supabase.from("reference_videos").update({ active: !r.active }).eq("id", r.id).then(reload)}>{r.active ? "Hide" : "Show"}</Button>
          </div>
        </div>
      ))}</div>
    </div>
  );
}

function Guides() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["hub", "learn", "docs"], queryFn: async () => (await supabase.from("documents").select("*").order("slug")).data ?? [] });
  const [slug, setSlug] = useState("creator-guide");
  const doc = data.find((d) => d.slug === slug);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { if (doc) setText(typeof doc.content === "string" ? doc.content : JSON.stringify(doc.content, null, 2)); }, [doc]);
  async function newVersion() {
    if (!doc) return;
    let content: unknown = text;
    if (typeof doc.content !== "string") { try { content = JSON.parse(text); } catch { toast.error("The content is not valid. Check brackets and quotes."); return; } }
    const version = Number(doc.current_version ?? 1) + 1;
    const { error: e1 } = await supabase.from("document_versions").insert({ document_id: doc.id, version, title: doc.title, content: content as never, note: note || null });
    if (e1) { toast.error("Could not save the new version."); return; }
    await supabase.from("documents").update({ content: content as never, current_version: version }).eq("id", doc.id);
    toast.success(`Version ${version} saved`); setNote(""); void qc.invalidateQueries({ queryKey: ["hub", "learn", "docs"] });
  }
  return (
    <div className={cn(card, "space-y-3")}>
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Document" className="h-10 rounded-xl border px-2 text-sm" value={slug} onChange={(e) => setSlug(e.target.value)}>{data.filter((d) => !["contract", "guide"].includes(d.slug)).map((d) => <option key={d.slug} value={d.slug}>{d.title} ({d.slug})</option>)}</select>
        {doc ? <>
          <span className="text-xs text-brand-navySoft">Version {doc.current_version}</span>
          <label className="ml-auto inline-flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(doc.published)} onChange={async (e) => { await supabase.from("documents").update({ published: e.target.checked }).eq("id", doc.id); void qc.invalidateQueries({ queryKey: ["hub", "learn", "docs"] }); toast.success(e.target.checked ? "Published to creators" : "Hidden from creators"); }} />Published</label>
        </> : null}
      </div>
      <p className="text-xs text-brand-navySoft">Author contracts and the author writing guide are managed in the authors portal and are not listed here.</p>
      <textarea aria-label="Content" rows={18} className="w-full rounded-xl border p-3 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2"><input aria-label="Change note" className="min-h-10 flex-1 rounded-xl border px-3 text-sm" placeholder="What changed (optional)" value={note} onChange={(e) => setNote(e.target.value)} /><Button onClick={() => void newVersion()}>Save as new version</Button></div>
    </div>
  );
}

function Templates() {
  const { appId } = useAdminApp();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["hub", "learn", "templates"],
    queryFn: async () => {
      const [t, e] = await Promise.all([supabase.from("saved_templates").select("*").order("kind").order("name"), supabase.from("creator_email_settings").select("*")]);
      return { saved: t.data ?? [], emails: e.data ?? [] };
    },
  });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "learn", "templates"] });
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold text-brand-navy">DM templates & saved replies</h3>
          <div className="flex gap-2">{(["dm", "reply"] as const).map((k) => <Button key={k} size="sm" variant="outline" onClick={async () => { await supabase.from("saved_templates").insert({ kind: k, name: k === "dm" ? "New DM" : "New reply", body: "", app_id: appId }); reload(); }}>Add {k === "dm" ? "DM" : "reply"}</Button>)}</div></div>
        <div className="mt-3 space-y-3">{(data?.saved ?? []).map((t) => (
          <div key={t.id} className="rounded-xl border p-3">
            <div className="flex gap-2"><span className="rounded-full bg-portal-bg px-2 py-1 text-xs font-bold uppercase">{t.kind}</span><input aria-label="Name" defaultValue={t.name} onBlur={(e) => void supabase.from("saved_templates").update({ name: e.target.value }).eq("id", t.id)} className="h-8 flex-1 rounded-lg border px-2 text-sm font-semibold" />
              <Button size="sm" variant="ghost" aria-label="Delete" onClick={async () => { if (window.confirm("Delete this template?")) { await supabase.from("saved_templates").delete().eq("id", t.id); reload(); } }}><Trash2 className="size-4" /></Button></div>
            <textarea aria-label="Text" rows={3} defaultValue={t.body} onBlur={(e) => void supabase.from("saved_templates").update({ body: e.target.value, updated_at: new Date().toISOString() }).eq("id", t.id)} className="mt-2 w-full rounded-lg border p-2 text-sm" />
          </div>
        ))}{!data?.saved.length ? <p className="text-sm text-brand-navySoft">No saved templates yet.</p> : null}</div>
      </div>
      <div className={card}>
        <h3 className="font-extrabold text-brand-navy">Email templates</h3>
        <p className="text-xs text-brand-navySoft">Merge fields: {"{first_name}"}, {"{full_name}"}.</p>
        <div className="mt-3 space-y-3">{(data?.emails ?? []).map((t) => (
          <div key={t.id} className="rounded-xl border p-3 space-y-2">
            <p className="text-xs font-bold uppercase text-brand-navySoft">{t.template_key}</p>
            <input aria-label="Subject" defaultValue={t.subject} onBlur={(e) => void supabase.from("creator_email_settings").update({ subject: e.target.value }).eq("id", t.id)} className="h-9 w-full rounded-lg border px-2 text-sm font-semibold" />
            <textarea aria-label="Intro" rows={3} defaultValue={t.intro} onBlur={(e) => void supabase.from("creator_email_settings").update({ intro: e.target.value }).eq("id", t.id)} className="w-full rounded-lg border p-2 text-sm" />
            <textarea aria-label="Instructions" rows={4} defaultValue={t.instructions} onBlur={(e) => void supabase.from("creator_email_settings").update({ instructions: e.target.value }).eq("id", t.id)} className="w-full rounded-lg border p-2 text-sm" />
          </div>
        ))}</div>
      </div>
    </div>
  );
}

export function Learn() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Briefs");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">{TABS.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("min-h-10 shrink-0 rounded-full px-4 text-sm font-bold", tab === t ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{t}</button>)}</div>
      {tab === "Briefs" ? <Briefs /> : tab === "Reference videos" ? <References /> : tab === "Guides & rules" ? <Guides /> : <Templates />}
    </div>
  );
}
