import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PortalCard } from "../ui";

type Media = { id: string; url: string | null; file_path: string | null; caption: string | null };
type Guide = { id: string; week_start: string; title: string; body: string; track: string | null; published: boolean; creator_guide_media: Media[] };

export function WeeklyGuidesAdmin() {
  const qc = useQueryClient();
  const [week, setWeek] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [track, setTrack] = useState("");

  const { data } = useQuery({
    queryKey: ["portal", "admin", "weekly-guides"],
    queryFn: async () =>
      ((await supabase.from("creator_weekly_guides").select("*, creator_guide_media(*)").order("week_start", { ascending: false })).data ?? []) as Guide[],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["portal", "admin", "weekly-guides"] });

  async function create(): Promise<unknown> {
    if (!week || !title.trim()) return toast.error("Week and title required.");
    const { error } = await supabase.from("creator_weekly_guides").insert({ week_start: week, title: title.trim(), body, track: track || null });
    if (error) return toast.error("Could not save.");
    setWeek(""); setTitle(""); setBody(""); setTrack(""); toast.success("Guide created (draft)."); return refresh();
  }

  async function patch(id: string, p: Record<string, unknown>) {
    const { error } = await supabase.from("creator_weekly_guides").update(p as never).eq("id", id);
    if (error) toast.error("Could not update."); else refresh();
  }

  async function remove(g: Guide) {
    if (!confirm(`Delete "${g.title}"?`)) return;
    const paths = g.creator_guide_media.map((m) => m.file_path).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("guide-media").remove(paths);
    await supabase.from("creator_weekly_guides").delete().eq("id", g.id);
    refresh();
  }

  async function addLink(g: Guide, url: string, caption: string): Promise<unknown> {
    if (!/^https?:\/\//.test(url)) return toast.error("Paste a valid link.");
    const { error } = await supabase.from("creator_guide_media").insert({ guide_id: g.id, url, caption: caption || null });
    return error ? toast.error("Could not add.") : refresh();
  }

  async function upload(g: Guide, file: File, caption: string): Promise<unknown> {
    const path = `${g.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const t = toast.loading("Uploading…");
    const { error } = await supabase.storage.from("guide-media").upload(path, file);
    if (error) { toast.dismiss(t); return toast.error("Upload failed."); }
    await supabase.from("creator_guide_media").insert({ guide_id: g.id, file_path: path, caption: caption || file.name });
    toast.dismiss(t); toast.success("Video attached."); return refresh();
  }

  async function removeMedia(m: Media) {
    if (m.file_path) await supabase.storage.from("guide-media").remove([m.file_path]);
    await supabase.from("creator_guide_media").delete().eq("id", m.id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <PortalCard className="grid gap-2 p-4 sm:grid-cols-2">
        <Input type="date" value={week} onChange={(e) => setWeek(e.target.value)} aria-label="Week starting" />
        <select className="rounded-md border border-input bg-background px-3 text-sm" value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="">All creators</option>
          <option value="ugc">UGC only</option>
          <option value="slideshow">Slideshow only</option>
        </select>
        <Input className="sm:col-span-2" placeholder="Guide title (e.g. Week 3 — hooks that stop the scroll)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea className="sm:col-span-2" rows={6} placeholder="Guide text for the week" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button onClick={create} className="sm:col-span-2">Create weekly guide</Button>
      </PortalCard>

      {(data ?? []).length === 0 ? (
        <PortalCard className="p-4"><EmptyState title="No weekly guide yet" text="Create the first one above." /></PortalCard>
      ) : (
        (data ?? []).map((g) => <GuideCard key={g.id} g={g} onPatch={patch} onRemove={remove} onLink={addLink} onUpload={upload} onRemoveMedia={removeMedia} />)
      )}
    </div>
  );
}

function GuideCard({ g, onPatch, onRemove, onLink, onUpload, onRemoveMedia }: {
  g: Guide;
  onPatch: (id: string, p: Record<string, unknown>) => void;
  onRemove: (g: Guide) => void;
  onLink: (g: Guide, url: string, caption: string) => void;
  onUpload: (g: Guide, f: File, caption: string) => void;
  onRemoveMedia: (m: Media) => void;
}) {
  const [body, setBody] = useState(g.body);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  return (
    <PortalCard className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 font-semibold text-brand-navy">Week of {g.week_start} — {g.title}</span>
        <span className="text-xs text-brand-navySoft">{g.track ?? "all"} · {g.published ? "published" : "draft"}</span>
        <Button size="sm" variant="outline" onClick={() => onPatch(g.id, { published: !g.published })}>{g.published ? "Unpublish" : "Publish"}</Button>
        <Button size="sm" variant="destructive" onClick={() => onRemove(g)}>Delete</Button>
      </div>
      <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} onBlur={() => body !== g.body && onPatch(g.id, { body })} />
      <ul className="space-y-1 text-sm">
        {g.creator_guide_media.map((m) => (
          <li key={m.id} className="flex items-center gap-2">
            <span className="flex-1 truncate">{m.file_path ? "Video file" : "Link"} · {m.caption ?? m.url}</span>
            <Button size="sm" variant="ghost" onClick={() => onRemoveMedia(m)}>Remove</Button>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <Input className="sm:col-span-2" placeholder="TikTok / Instagram / YouTube link" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button variant="outline" onClick={() => { onLink(g, url.trim(), caption.trim()); setUrl(""); setCaption(""); }}>Attach link</Button>
      </div>
      <label className="block text-sm">
        <span className="text-brand-navySoft">Or upload a video file: </span>
        <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(g, f, caption.trim()); e.target.value = ""; setCaption(""); }} />
      </label>
    </PortalCard>
  );
}
