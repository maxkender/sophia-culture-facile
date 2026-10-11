import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { assetLinks, assetUploadSlot } from "@/lib/brief-studio.functions";
import { FOLDERS } from "@/lib/brief-studio";
import type { BriefAsset } from "./BriefPreview";
import { PostThumb } from "./PostThumb";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const FOLDER_ROLE: Record<string, string> = { screen_recordings: "app_screen_recording", logos: "logo", sounds: "sound", broll: "broll", captions: "caption_text", references: "reference_video" };
function kindOf(f: File) { const t = f.type; return t.startsWith("video/") ? "video" : t.startsWith("image/") ? "image" : t.startsWith("audio/") ? "audio" : t === "application/pdf" ? "pdf" : "text"; }
function folderFor(kind: string) { return kind === "audio" ? "sounds" : kind === "image" ? "logos" : kind === "video" ? "screen_recordings" : "references"; }

/** Drag-drop multi-upload (≤ 200 MB each, with progress) + paste a link. Used by the library and inline in the Studio. */
export function AssetUploader({ appId, folder, onDone, compact = false, replaceId }: { appId: string; folder?: string; onDone?: (a: BriefAsset) => void; compact?: boolean; replaceId?: string }) {
  const slot = useServerFn(assetUploadSlot);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [link, setLink] = useState("");
  const qc = useQueryClient();
  async function uploadOne(f: File) {
    if (f.size > 200 * 1024 * 1024) { toast.error(`${f.name} is over 200 MB.`); return; }
    const { path, token } = await slot({ data: { appId, name: f.name } });
    const base = import.meta.env["VITE_SUPABASE_URL"] as string;
    await new Promise<void>((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("PUT", `${base}/storage/v1/object/upload/sign/creator-assets/${path}?token=${encodeURIComponent(token)}`);
      x.setRequestHeader("x-upsert", "false");
      if (f.type) x.setRequestHeader("content-type", f.type);
      x.upload.onprogress = (e) => setProgress((p) => ({ ...p, [f.name]: Math.round((e.loaded / e.total) * 100) }));
      x.onload = () => (x.status < 300 ? resolve() : reject(new Error(x.responseText)));
      x.onerror = () => reject(new Error("network"));
      x.send(f);
    });
    const kind = kindOf(f);
    const fold = folder ?? folderFor(kind);
    const row = { app_id: appId, kind, folder: fold, storage_path: path, title: f.name.replace(/\.[^.]+$/, ""), role_default: FOLDER_ROLE[fold] ?? "reference_video", size_bytes: f.size, mime: f.type || null, status: "ready" };
    const res = replaceId
      ? await supabase.from("assets").update({ ...row, title: undefined } as never).eq("id", replaceId).select("*").single()
      : await supabase.from("assets").insert(row as never).select("*").single();
    if (res.error || !res.data) throw new Error("save");
    setProgress((p) => { const n = { ...p }; delete n[f.name]; return n; });
    onDone?.({ ...(res.data as unknown as BriefAsset), role: res.data.role_default });
  }
  async function files(list: FileList | File[]) {
    for (const f of Array.from(list)) {
      try { await uploadOne(f); toast.success(`${f.name} uploaded`); } catch { toast.error(`${f.name} could not be uploaded.`); setProgress((p) => { const n = { ...p }; delete n[f.name]; return n; }); }
    }
    void qc.invalidateQueries({ queryKey: ["hub", "assets"] }); void qc.invalidateQueries({ queryKey: ["hub", "studio-side"] });
  }
  async function addLink() {
    const u = link.trim();
    if (!/^https:\/\//.test(u)) { toast.error("Paste a full link starting with https://"); return; }
    let thumb: string | null = null; let title = u.replace(/^https:\/\/(www\.)?/, "").slice(0, 60);
    if (/tiktok\.com/.test(u)) { try { const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`); if (r.ok) { const j = await r.json(); thumb = j.thumbnail_url ?? null; title = j.title?.slice(0, 80) || title; } } catch { /* keep */ } }
    const yt = u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/); if (yt) thumb = `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
    const { data, error } = await supabase.from("assets").insert({ app_id: appId, kind: "link", folder: folder ?? "references", url: u, title, thumbnail_url: thumb, role_default: "reference_video" } as never).select("*").single();
    if (error || !data) { toast.error("Could not add the link."); return; }
    setLink(""); onDone?.({ ...(data as unknown as BriefAsset), role: data.role_default }); void qc.invalidateQueries({ queryKey: ["hub", "assets"] });
  }
  return (
    <div className="space-y-2">
      <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void files(e.dataTransfer.files); }} className={cn("flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-line text-center text-sm text-brand-navySoft hover:bg-portal-bg", compact ? "p-3" : "p-6")}>
        <Upload className="size-5" /><span><b className="text-brand-navy">{replaceId ? "Upload the recording" : "Drop files or click"}</b> · videos up to 200 MB</span>
        <input type="file" multiple={!replaceId} className="sr-only" aria-label="Upload files" onChange={(e) => e.target.files && void files(e.target.files)} />
      </label>
      {Object.entries(progress).map(([n, p]) => <div key={n} className="text-xs"><span className="font-semibold">{n}</span><div className="mt-1 h-1.5 rounded-full bg-portal-bg"><div className="h-1.5 rounded-full bg-portal-accent" style={{ width: `${p}%` }} /></div></div>)}
      {!replaceId ? <div className="flex gap-2"><input aria-label="Asset link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Or paste a TikTok / Instagram / Drive / YouTube link" className="h-9 flex-1 rounded-lg border px-2 text-sm" /><Button size="sm" variant="outline" onClick={() => void addLink()}>Add link</Button></div> : null}
    </div>
  );
}

type Row = BriefAsset & { folder: string; tags: string[]; status: string; shot_note: string | null; role_default: string; size_bytes: number | null; mime: string | null };

export function AssetsLibrary() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient();
  const links = useServerFn(assetLinks);
  const [folder, setFolder] = useState<string>("screen_recordings");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const [text, setText] = useState({ title: "", body: "" });
  const { data } = useQuery({
    queryKey: ["hub", "assets", app],
    queryFn: async () => {
      const [a, u] = await Promise.all([
        supabase.from("assets").select("*").eq("app_id", app).order("status", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("brief_assets").select("asset_id"),
      ]);
      const used: Record<string, number> = {};
      for (const r of u.data ?? []) used[r.asset_id] = (used[r.asset_id] ?? 0) + 1;
      return { rows: (a.data ?? []) as unknown as Row[], used };
    },
  });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "assets"] });
  const rows = useMemo(() => (data?.rows ?? []).filter((r) => r.folder === folder && (!q || `${r.title} ${r.tags.join(" ")} ${r.text_content ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [data, folder, q]);
  async function open(r: Row) {
    if (r.kind === "link" && r.url) { window.open(r.url, "_blank", "noopener"); return; }
    const u = (await links({ data: { ids: [r.id] } })).urls[r.id];
    if (u) setPreview({ id: r.id, url: u }); else toast.error("No file yet.");
  }
  async function remove(r: Row) {
    if (data?.used[r.id]) { toast.error(`Used in ${data.used[r.id]} brief(s) — detach it first.`); return; }
    if (!window.confirm(`Delete “${r.title}”?`)) return;
    if (r.storage_path) await supabase.storage.from("creator-assets").remove([r.storage_path]);
    const { error } = await supabase.from("assets").delete().eq("id", r.id);
    if (error) toast.error("Could not delete (still attached to a campaign or creator?)."); else reload();
  }
  async function bulkTag() {
    const t = window.prompt("Tag to add to the selected files"); if (!t?.trim()) return;
    for (const r of (data?.rows ?? []).filter((x) => sel.includes(x.id))) await supabase.from("assets").update({ tags: [...new Set([...r.tags, t.trim()])] }).eq("id", r.id);
    setSel([]); reload();
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">{FOLDERS.map(([k, l]) => <button key={k} type="button" onClick={() => setFolder(k)} className={cn("min-h-9 shrink-0 rounded-full px-3 text-xs font-bold", folder === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l} {(data?.rows ?? []).filter((r) => r.folder === k).length}</button>)}</div>
      <div className={cn(card, "space-y-3")}>
        {folder === "captions" ? (
          <form className="grid gap-2 sm:grid-cols-[200px_1fr_auto]" onSubmit={async (e) => { e.preventDefault(); if (!text.body.trim()) return; await supabase.from("assets").insert({ app_id: app, kind: "text", folder: "captions", title: text.title || "Texte", text_content: text.body, role_default: "caption_text" }); setText({ title: "", body: "" }); reload(); }}>
            <input aria-label="Text title" placeholder="Title (bio, CTA, hashtags…)" value={text.title} onChange={(e) => setText({ ...text, title: e.target.value })} className="h-10 rounded-lg border px-2 text-sm" />
            <input aria-label="Text" placeholder="The text creators copy" value={text.body} onChange={(e) => setText({ ...text, body: e.target.value })} className="h-10 rounded-lg border px-2 text-sm" />
            <Button type="submit">Add text</Button>
          </form>
        ) : <AssetUploader appId={app} folder={folder} onDone={reload} />}
        <div className="flex flex-wrap gap-2"><input aria-label="Search assets" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tags, text" className="h-9 flex-1 rounded-lg border px-2 text-sm" /><Button size="sm" variant="outline" disabled={!sel.length} onClick={() => void bulkTag()}>Tag selected ({sel.length})</Button></div>
      </div>
      {!rows.length ? <p className={cn(card, "text-sm text-brand-navySoft")}>Nothing in this folder yet.</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((r) => (
          <div key={r.id} className={cn(card, "space-y-2 p-3", r.status === "to_upload" && "border-2 border-dashed border-portal-amber")} data-testid="asset-card">
            <div className="flex items-start gap-2">
              <input type="checkbox" aria-label={`Select ${r.title}`} checked={sel.includes(r.id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} className="mt-1" />
              <div className="min-w-0 flex-1">
                <input aria-label="Title" defaultValue={r.title} onBlur={(e) => void supabase.from("assets").update({ title: e.target.value }).eq("id", r.id)} className="h-8 w-full rounded-lg border-transparent px-1 text-sm font-bold hover:border-input" />
                <p className="px-1 text-xs text-brand-navySoft">{r.status === "to_upload" ? "À filmer" : r.kind}{r.size_bytes ? ` · ${(r.size_bytes / 1048576).toFixed(1)} MB` : ""} · used in {data?.used[r.id] ?? 0} briefs</p>
              </div>
            </div>
            {r.status === "to_upload" ? <>
              <p className="rounded-lg bg-portal-amber/15 p-2 text-sm text-brand-navy"><b>Shot to record:</b> {r.shot_note}</p>
              <AssetUploader appId={app} folder={r.folder} replaceId={r.id} onDone={reload} compact />
            </> : r.kind === "text" ? (
              <textarea aria-label="Text" defaultValue={r.text_content ?? ""} rows={3} onBlur={(e) => void supabase.from("assets").update({ text_content: e.target.value }).eq("id", r.id)} className="w-full rounded-lg border p-2 text-sm" />
            ) : preview?.id === r.id ? (
              r.kind === "video" ? <video src={preview.url} controls className="aspect-[9/16] max-h-80 w-full rounded-lg bg-brand-navy" /> : r.kind === "image" ? <img src={preview.url} alt="" className="w-full rounded-lg" /> : r.kind === "audio" ? <audio src={preview.url} controls className="w-full" /> : <a href={preview.url} className="text-sm text-portal-accent" target="_blank" rel="noreferrer">Open file</a>
            ) : r.kind === "link" && r.url ? <PostThumb url={r.url} className="aspect-video w-full rounded-lg" /> : r.thumbnail_url ? <img src={r.thumbnail_url} alt="" className="aspect-video w-full rounded-lg object-cover" /> : null}
            <input aria-label="Tags" defaultValue={r.tags.join(", ")} placeholder="tags, comma separated" onBlur={(e) => void supabase.from("assets").update({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }).eq("id", r.id).then(reload)} className="h-8 w-full rounded-lg border px-2 text-xs" />
            <div className="flex gap-1">
              {r.status === "ready" && r.kind !== "text" ? <Button size="sm" variant="outline" onClick={() => void open(r)}>{r.kind === "link" ? "Open" : "Preview"}</Button> : null}
              {r.storage_path ? <Button size="sm" variant="outline" aria-label="Download" onClick={async () => { const u = (await links({ data: { ids: [r.id] } })).urls[r.id]; if (u) window.location.href = u; }}><Download className="size-3.5" /></Button> : null}
              <Button size="sm" variant="ghost" aria-label="Delete" className="ml-auto" disabled={Boolean(data?.used[r.id])} title={data?.used[r.id] ? "Used in briefs" : undefined} onClick={() => void remove(r)}><Trash2 className="size-4" /></Button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
