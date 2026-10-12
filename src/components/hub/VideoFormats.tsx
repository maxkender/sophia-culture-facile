import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { blankPlan } from "@/lib/brief-studio";
import { formatText, setFormatText, useUgcFormats, type UgcFormat } from "@/lib/ugc-formats";
import { PlanAssets } from "./StylePickers";
const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm";

export function VideoFormats() {
  const { data = [], isLoading, error } = useUgcFormats();
  const [edit, setEdit] = useState<UgcFormat | null>(null);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const { data: examples = [] } = useQuery({ queryKey: ["format-example-picker"], enabled: Boolean(edit), queryFn: async () => { const { data, error } = await supabase.from("inspirations").select("id, author_handle, hook_text, url").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } });
  const { data: assets = [] } = useQuery({ queryKey: ["format-asset-picker"], enabled: Boolean(edit), queryFn: async () => { const { data, error } = await supabase.from("assets").select("id, kind, title, thumbnail_url, tags, folder").eq("status", "ready"); if (error) throw error; return data ?? []; } });
  const change = (patch: Partial<UgcFormat>) => setEdit((v) => v ? { ...v, ...patch } : v);
  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      const { error, data } = await supabase.from("ugc_formats").update({ name_en: edit.name_en, name_fr: edit.name_fr, description: edit.description, when_to_use: edit.when_to_use, tips: edit.tips, structure: edit.structure as never, example_inspiration_ids: edit.example_inspiration_ids }).eq("id", edit.id).select("id").single();
      if (error || !data) throw error ?? new Error("Not saved");
      await qc.invalidateQueries({ queryKey: ["ugc-formats"] }); setEdit(null); toast.success("Format saved");
    } catch { toast.error("Could not save the format."); } finally { setBusy(false); }
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading formats…</p>;
  if (error) return <p className="text-sm text-destructive">Could not load formats.</p>;
  return <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map((f) => <article key={f.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4" data-testid="video-format-card">
      <h2 className="text-base font-bold">{f.sort_order}. {f.name_en}</h2>
      <p className="text-sm text-muted-foreground">{formatText(f.description)}</p>
      <div className="text-sm"><p className="font-semibold">When to use it</p><p>{formatText(f.when_to_use)}</p></div>
      <ol className="list-inside list-decimal text-sm">{f.structure.shots.map((s, i) => <li key={i}>{s.label || `Shot ${i + 1}`}</li>)}</ol>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{formatText(f.tips)}</p>
      <Button size="sm" variant="outline" className="mt-auto self-start" onClick={() => { setEdit(structuredClone(f)); setSearch(""); }}><Pencil className="size-3.5" />Edit</Button>
    </article>)}</div>
    <Dialog open={Boolean(edit)} onOpenChange={(open) => { if (!open) setEdit(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{edit?.sort_order}. {edit?.name_en}</DialogTitle></DialogHeader>
      {edit ? <div className="space-y-4">
        <div className="flex gap-2">{(["en", "fr"] as const).map((lang) => <Button key={lang} size="sm" variant={language === lang ? "default" : "outline"} onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</Button>)}</div>
        <label className="block text-sm font-semibold">Name<input className={field} value={language === "en" ? edit.name_en : edit.name_fr} onChange={(e) => change(language === "en" ? { name_en: e.target.value } : { name_fr: e.target.value })} /></label>
        {(["description", "when_to_use", "tips"] as const).map((key) => <label key={key} className="block text-sm font-semibold">{{ description: "One-line description", when_to_use: "When to use it", tips: "Tips" }[key]}<textarea className={field} rows={key === "tips" ? 3 : 2} value={formatText(edit[key], language)} onChange={(e) => change({ [key]: setFormatText(edit[key], language, e.target.value) })} /></label>)}
        <section className="space-y-3"><h3 className="font-semibold">Plan structure</h3>{edit.structure.shots.map((shot, i) => <div key={i} className="space-y-2 border-t pt-3">
          <div className="flex items-center gap-2"><input aria-label={`Shot ${i + 1} name`} className={field} value={shot.label} onChange={(e) => change({ structure: { ...edit.structure, shots: edit.structure.shots.map((s, j) => j === i ? { ...s, label: e.target.value } : s) } })} /><Button size="icon" variant="ghost" aria-label={`Remove shot ${i + 1}`} disabled={edit.structure.shots.length === 1} onClick={() => change({ structure: { ...edit.structure, shots: edit.structure.shots.filter((_, j) => j !== i) } })}><Trash2 className="size-4" /></Button></div>
          {(["do", "on_screen", "say", "camera"] as const).map((key) => <label key={key} className="block text-xs font-semibold">{{ do: "What we see", on_screen: "Text on screen", say: "What is said", camera: "Timing / framing" }[key]}<textarea className={field} rows={1} value={shot[key]} onChange={(e) => change({ structure: { ...edit.structure, shots: edit.structure.shots.map((s, j) => j === i ? { ...s, [key]: e.target.value } : s) } })} /></label>)}
          <PlanAssets label="Asset slots" value={shot.assets} library={assets} onChange={(value) => change({ structure: { ...edit.structure, shots: edit.structure.shots.map((s, j) => j === i ? { ...s, assets: value } : s) } })} />
        </div>)}<Button size="sm" variant="outline" onClick={() => change({ structure: { ...edit.structure, shots: [...edit.structure.shots, { ...blankPlan(), label: `Shot ${edit.structure.shots.length + 1}` }] } })}><Plus className="size-4" />Add shot</Button></section>
        <section className="space-y-2"><h3 className="font-semibold">Example inspirations ({edit.example_inspiration_ids.length}/3)</h3><input aria-label="Search example inspirations" className={field} placeholder="Search Inspiration" value={search} onChange={(e) => setSearch(e.target.value)} /><div className="max-h-48 space-y-2 overflow-y-auto">{examples.filter((x) => `${x.author_handle} ${x.hook_text}`.toLowerCase().includes(search.toLowerCase())).map((x) => <label key={x.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={edit.example_inspiration_ids.includes(x.id)} disabled={edit.example_inspiration_ids.length >= 3 && !edit.example_inspiration_ids.includes(x.id)} onChange={(e) => change({ example_inspiration_ids: e.target.checked ? [...edit.example_inspiration_ids, x.id] : edit.example_inspiration_ids.filter((id) => id !== x.id) })} /><span>{x.author_handle || "Video"} · {x.hook_text || x.url}</span></label>)}</div></section>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button disabled={busy || !edit.name_en.trim() || !edit.name_fr.trim()} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button></div>
      </div> : null}
    </DialogContent></Dialog>
  </>;
}
