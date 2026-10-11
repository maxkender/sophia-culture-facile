import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { generateFormatVariants } from "@/lib/hub-learn.functions";
import { PostThumb } from "./PostThumb";
import { BriefsList } from "./BriefsList";
import { AssetsLibrary } from "./Assets";
import { UgcBriefsGrid, WeekPlanner } from "@/components/portal/admin/UgcAdmin";
import { CreatorOps } from "@/components/portal/admin/CreatorOps";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const TABS = ["Formats", "Briefs", "Assets", "References", "Guides & rules", "Templates"] as const;


type Fmt = { id: string; title: string; hook_text: string | null; oral_hook: string | null; beats: string[] | null; product_moment: string | null; variations: string | null; effort: string | null; status: string; pinned: boolean; sort_order: number | null; app_id: string };
const EFFORTS = [["pov", "POV"], ["reaction", "Reaction"], ["talking_head", "Face cam"]] as const;

function Formats() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient();
  const gen = useServerFn(generateFormatVariants);
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<Fmt | null>(null);
  const { data } = useQuery({
    queryKey: ["hub", "learn", "formats", app],
    queryFn: async () => {
      const [f, v] = await Promise.all([
        supabase.from("briefs").select("id, title, hook_text, oral_hook, beats, product_moment, variations, effort, status, pinned, sort_order, app_id").eq("app_id", app).eq("brief_type", "format").order("pinned", { ascending: false }).order("sort_order"),
        supabase.from("briefs").select("parent_format_id").eq("app_id", app).not("parent_format_id", "is", null),
      ]);
      const counts: Record<string, number> = {};
      for (const r of v.data ?? []) counts[r.parent_format_id as string] = (counts[r.parent_format_id as string] ?? 0) + 1;
      return { formats: (f.data ?? []) as unknown as Fmt[], counts };
    },
  });
  async function save(x: Fmt) {
    const row = { title: x.title, hook_text: x.hook_text, hook: x.hook_text, oral_hook: x.oral_hook, beats: x.beats ?? [], product_moment: x.product_moment, variations: x.variations, effort: x.effort, status: x.status, pinned: x.pinned, app_id: app, brief_type: "format", platform: "both", body: [x.hook_text, ...(x.beats ?? [])].filter(Boolean).join("\n") };
    const { error } = x.id ? await supabase.from("briefs").update(row as never).eq("id", x.id) : await supabase.from("briefs").insert(row as never);
    if (error) toast.error("Could not save."); else { toast.success("Format saved"); setEdit(null); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); }
  }
  if (edit) {
    const set = (k: keyof Fmt, v: unknown) => setEdit({ ...edit, [k]: v } as Fmt);
    const beats = [...(edit.beats ?? []), "", "", ""].slice(0, 3);
    return (
      <div className={cn(card, "space-y-3")}>
        <button type="button" className="text-sm font-semibold text-portal-accent" onClick={() => setEdit(null)}>← Formats</button>
        <label className="block text-sm font-semibold">Title<input value={edit.title} onChange={(e) => set("title", e.target.value)} className="mt-1 h-10 w-full rounded-xl border px-3" /></label>
        <label className="block text-sm font-semibold">Hook on frame 1<input value={edit.hook_text ?? ""} onChange={(e) => set("hook_text", e.target.value)} className="mt-1 h-10 w-full rounded-xl border px-3" /></label>
        <label className="block text-sm font-semibold">Oral hook<input value={edit.oral_hook ?? ""} onChange={(e) => set("oral_hook", e.target.value)} className="mt-1 h-10 w-full rounded-xl border px-3" /></label>
        {beats.map((b, i) => <label key={i} className="block text-sm font-semibold">Beat {i + 1}<input value={b} onChange={(e) => { const nb = [...beats]; nb[i] = e.target.value; set("beats", nb); }} className="mt-1 h-10 w-full rounded-xl border px-3" /></label>)}
        <label className="block text-sm font-semibold">Product moment<textarea value={edit.product_moment ?? ""} onChange={(e) => set("product_moment", e.target.value)} className="mt-1 w-full rounded-xl border p-3" rows={2} /></label>
        <label className="block text-sm font-semibold">Variations (how to make 10 videos from it)<textarea value={edit.variations ?? ""} onChange={(e) => set("variations", e.target.value)} className="mt-1 w-full rounded-xl border p-3" rows={2} /></label>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-semibold">Effort<select value={edit.effort ?? "pov"} onChange={(e) => set("effort", e.target.value)} className="mt-1 block h-10 rounded-xl border px-2">{EFFORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="text-sm font-semibold">Status<select value={edit.status} onChange={(e) => set("status", e.target.value)} className="mt-1 block h-10 rounded-xl border px-2">{["draft", "published", "archived"].map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="mt-6 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={edit.pinned} onChange={(e) => set("pinned", e.target.checked)} />Pinned</label>
        </div>
        <Button onClick={() => void save(edit)}>Save format</Button>
      </div>
    );
  }
  const list = data?.formats ?? [];
  return (
    <div className="space-y-4">
      <div className={cn(card, "flex flex-wrap items-center gap-3")}>
        <Button onClick={() => setEdit({ id: "", title: "", hook_text: "", oral_hook: "", beats: ["", "", ""], product_moment: "", variations: "", effort: "pov", status: "draft", pinned: false, sort_order: null, app_id: app })}>New format</Button>
        <p className="text-sm text-brand-navySoft">{list.length} formats · repeatable mechanics creators shoot again and again. Variants land as draft briefs in Briefs.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((f, i) => (
        <div key={f.id} className={cn(card, "flex flex-col gap-2")} data-testid="format-card">
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-brand-navySoft">#{i + 1}{f.pinned ? " · pinned" : ""} · {f.status}</span><span className="rounded-full bg-portal-bg px-2 py-0.5 text-xs font-bold">{EFFORTS.find(([k]) => k === f.effort)?.[1] ?? "—"}</span></div>
          <p className="text-lg font-extrabold leading-tight text-brand-navy">{f.hook_text}</p>
          <p className="text-sm font-semibold text-brand-navySoft">{f.title}</p>
          <ol className="list-decimal pl-5 text-xs text-brand-navySoft">{(f.beats ?? []).map((b, j) => <li key={j}>{b}</li>)}</ol>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setEdit(f)}>Edit</Button>
            <Button size="sm" disabled={busy === f.id} onClick={async () => { setBusy(f.id); try { const r = await gen({ data: { formatId: f.id } }); toast.success(`${r.created} draft variants saved in Briefs`); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); } }}><Sparkles className="size-4" />{busy === f.id ? "Writing…" : "Générer 5 variantes"}</Button>
            {data?.counts[f.id] ? <span className="text-xs text-brand-navySoft">{data.counts[f.id]} variants</span> : null}
          </div>
        </div>
      ))}</div>
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
      <ReferenceLibrary />
    </div>
  );
}

const KINDS = ["all", "account", "search", "hashtag", "format"] as const;
function ReferenceLibrary() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const { data = [] } = useQuery({ queryKey: ["hub", "learn", "library", app], queryFn: async () => (await supabase.from("reference_library").select("*").eq("app_id", app).order("kind").order("created_at")).data ?? [] });
  const rows = data.filter((r) => kind === "all" || r.kind === kind);
  return (
    <div className="space-y-3 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-extrabold text-brand-navy">Accounts, searches & formats</h3>
        <div className="flex gap-1 overflow-x-auto">{KINDS.map((k) => <button key={k} type="button" onClick={() => setKind(k)} className={cn("min-h-9 shrink-0 rounded-full px-3 text-xs font-bold capitalize", kind === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{k} {k === "all" ? data.length : data.filter((r) => r.kind === k).length}</button>)}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((r) => (
        <div key={r.id} className={cn(card, "space-y-2 p-4")}>
          <div className="flex items-center gap-2">
            {r.kind === "account" && r.url ? <AccountAvatar url={r.url} /> : null}
            <span className="rounded-full bg-portal-bg px-2 py-0.5 text-[10px] font-bold uppercase text-brand-navySoft">{r.kind}</span>
            <span className="text-[10px] text-brand-navySoft">{r.category?.replace(/_/g, " ")}</span>
          </div>
          {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="block font-extrabold text-brand-navy underline-offset-2 hover:underline">{r.title}</a> : <p className="font-extrabold text-brand-navy">{r.title}</p>}
          <p className="whitespace-pre-line text-sm text-brand-navySoft">{r.note}</p>
          {r.tags.length ? <p className="flex flex-wrap gap-1">{r.tags.map((t: string) => <span key={t} className="rounded-full bg-portal-accent/10 px-2 py-0.5 text-[10px] font-bold text-portal-accent">#{t}</span>)}</p> : null}
        </div>
      ))}</div>
    </div>
  );
}

/** TikTok oEmbed gives the account avatar for profile URLs when available; otherwise nothing is shown. */
function AccountAvatar({ url }: { url: string }) {
  const { data } = useQuery({ queryKey: ["oembed-avatar", url], staleTime: 86400_000, retry: false, queryFn: async () => {
    const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`); if (!r.ok) return null;
    const j = (await r.json()) as { thumbnail_url?: string }; return j.thumbnail_url ?? null;
  } });
  return data ? <img src={data} alt="" loading="lazy" className="size-8 rounded-full object-cover" /> : <span className="flex size-8 items-center justify-center rounded-full bg-portal-bg text-xs font-bold text-brand-navy">@</span>;
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
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold text-brand-navy">DM templates, saved replies & nurture emails</h3>
          <div className="flex gap-2">{(["dm", "reply"] as const).map((k) => <Button key={k} size="sm" variant="outline" onClick={async () => { await supabase.from("saved_templates").insert({ kind: k, name: k === "dm" ? "New DM" : "New reply", body: "", app_id: appId }); reload(); }}>Add {k === "dm" ? "DM" : "reply"}</Button>)}</div></div>
        <div className="mt-3 space-y-3">{(data?.saved ?? []).map((t) => (
          <div key={t.id} className="rounded-xl border p-3">
            <div className="flex gap-2"><span className="rounded-full bg-portal-bg px-2 py-1 text-xs font-bold uppercase">{t.kind}</span><input aria-label="Name" defaultValue={t.name} onBlur={(e) => void supabase.from("saved_templates").update({ name: e.target.value }).eq("id", t.id)} className="h-8 flex-1 rounded-lg border px-2 text-sm font-semibold" />
              <Button size="sm" variant="ghost" aria-label="Delete" onClick={async () => { if (window.confirm("Delete this template?")) { await supabase.from("saved_templates").delete().eq("id", t.id); reload(); } }}><Trash2 className="size-4" /></Button></div>
            {t.kind === "email" ? <input aria-label="Subject" defaultValue={t.subject ?? ""} placeholder="Subject" onBlur={(e) => void supabase.from("saved_templates").update({ subject: e.target.value }).eq("id", t.id)} className="mt-2 h-8 w-full rounded-lg border px-2 text-sm" /> : null}
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

const BRIEF_SUBS = [["list", "All briefs"], ["planner", "Week planner"], ["scripts", "Scripts grid"], ["ops", "Posts & calls"]] as const;
function BriefsArea({ sub }: { sub?: string | undefined }) {
  const [s, setS] = useState<string>(BRIEF_SUBS.some(([k]) => k === sub) ? sub! : "list");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">{BRIEF_SUBS.map(([k, l]) => <button key={k} type="button" onClick={() => setS(k)} className={cn("min-h-9 shrink-0 rounded-full border px-3 text-xs font-bold", s === k ? "border-brand-navy bg-brand-navy text-card" : "border-brand-line bg-card text-brand-navy")}>{l}</button>)}</div>
      {s === "planner" ? <WeekPlanner /> : s === "scripts" ? <UgcBriefsGrid /> : s === "ops" ? <CreatorOps /> : <BriefsList />}
    </div>
  );
}

export function Learn({ initialTab, sub }: { initialTab?: string | undefined; sub?: string | undefined } = {}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>((TABS as readonly string[]).includes(initialTab ?? "") ? (initialTab as (typeof TABS)[number]) : "Formats");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">{TABS.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("min-h-10 shrink-0 rounded-full px-4 text-sm font-bold", tab === t ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{t}</button>)}</div>
      {tab === "Formats" ? <Formats /> : tab === "Briefs" ? <BriefsArea sub={sub} /> : tab === "Assets" ? <AssetsLibrary /> : tab === "References" ? <References /> : tab === "Guides & rules" ? <Guides /> : <Templates />}
    </div>
  );
}
