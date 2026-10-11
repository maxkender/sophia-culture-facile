import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID } from "@/lib/apps";
import { t as ct } from "@/i18n/creator-app";

/* "Consignes de tournage": one editable list shown on the creator Rules page, on every brief and as the submit checklist. */
export type Guideline = { id: string; sort_order: number; title_fr: string; title_en: string; body_fr: string; body_en: string; image_data: string | null; app_id: string | null; active: boolean };
const KEY = ["ugc-guidelines"];
const UNSWIPE = "00000000-0000-4000-8000-000000000002";

export function useGuidelines(appId?: string | null, all = false) {
  return useQuery({
    queryKey: [...KEY, all],
    queryFn: async () => ((await supabase.from("ugc_guidelines").select("*").order("sort_order")).data ?? []) as Guideline[],
    select: (rows) => rows.filter((g) => (all || g.active) && (!appId || !g.app_id || g.app_id === appId)),
  });
}

function GuidelineItem({ g, en }: { g: Guideline; en?: boolean | undefined }) {
  return (
    <li className="flex gap-3">
      {g.image_data ? <img src={g.image_data} alt="" className="size-12 shrink-0 rounded-lg object-cover" /> : null}
      <span><b className="text-brand-navy">{en ? g.title_en : g.title_fr}</b>{(en ? g.body_en : g.body_fr) ? <span className="block text-sm text-brand-navySoft">{en ? g.body_en : g.body_fr}</span> : null}</span>
    </li>
  );
}

export function GuidelinesList({ appId, en }: { appId?: string | null | undefined; en?: boolean | undefined }) {
  const { data = [] } = useGuidelines(appId);
  if (!data.length) return null;
  return <ol className="space-y-3">{data.map((g) => <GuidelineItem key={g.id} g={g} en={en} />)}</ol>;
}

/** Collapsible block shown on every brief. */
export function GuidelinesBlock({ appId }: { appId?: string | null }) {
  const { data = [] } = useGuidelines(appId);
  const [open, setOpen] = useState(false);
  if (!data.length) return null;
  return (
    <div className="rounded-2xl border border-brand-line bg-card" data-testid="guidelines-block">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 p-4 text-left font-extrabold text-brand-navy">
        Consignes de tournage ({data.length})<ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
      </button>
      {open ? <div className="border-t border-brand-line p-4"><ol className="space-y-3">{data.map((g) => <GuidelineItem key={g.id} g={g} />)}</ol></div> : null}
    </div>
  );
}

/** Checklist ticked when submitting a post link. */
export function GuidelinesChecklist({ appId, value, onChange }: { appId?: string | null; value: string[]; onChange: (v: string[]) => void }) {
  const { data = [] } = useGuidelines(appId);
  if (!data.length) return null;
  return (
    <fieldset className="space-y-2" data-testid="guidelines-checklist">
      <legend className="mb-1 text-sm font-bold text-brand-navy">Consignes respectées ({value.filter((v) => data.some((g) => g.id === v)).length}/{data.length})</legend>
      {data.map((g) => (
        <label key={g.id} className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={value.includes(g.id)} onChange={(e) => onChange(e.target.checked ? [...value, g.id] : value.filter((x) => x !== g.id))} />
          <span><b>{g.title_fr}</b>{g.body_fr ? <span className="text-brand-navySoft"> — {g.body_fr}</span> : null}</span>
        </label>
      ))}
    </fieldset>
  );
}

const f = "h-9 w-full rounded-lg border bg-card px-2 text-sm";

/** Admin editor: add, edit, reorder, delete, on/off, app scope, example image (small, stored inline). */
export function GuidelinesEditor() {
  const { data = [] } = useGuidelines(null, true); const qc = useQueryClient();
  const reload = () => void qc.invalidateQueries({ queryKey: KEY });
  async function save(id: string, patch: Partial<Guideline>) { const { error } = await supabase.from("ugc_guidelines").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id); if (error) toast.error(ct("Could not save")); reload(); }
  async function move(i: number, d: -1 | 1) {
    const a = data[i]; const b = data[i + d]; if (!a || !b) return;
    await Promise.all([supabase.from("ugc_guidelines").update({ sort_order: b.sort_order }).eq("id", a.id), supabase.from("ugc_guidelines").update({ sort_order: a.sort_order }).eq("id", b.id)]);
    if (a.sort_order === b.sort_order) await supabase.from("ugc_guidelines").update({ sort_order: a.sort_order + d }).eq("id", a.id);
    reload();
  }
  async function image(id: string, file: File | undefined) {
    if (!file) return; if (file.size > 400_000) { toast.error(ct("Pick an image under 400 KB.")); return; }
    const url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
    await save(id, { image_data: url });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div><h3 className="font-extrabold text-brand-navy">{ct("Consignes de tournage")}</h3><p className="text-xs text-brand-navySoft">{ct("Shown on the creator Rules page, on every brief (collapsible) and as the checklist when a creator submits a link.")}</p></div>
        <Button size="sm" onClick={async () => { await supabase.from("ugc_guidelines").insert({ title_fr: "Nouvelle consigne", title_en: "New guideline", sort_order: (data.at(-1)?.sort_order ?? 0) + 1 }); reload(); }}><Plus className="size-4" />{ct("Add")}</Button>
      </div>
      {data.map((g, i) => (
        <div key={g.id} className={cn("grid gap-2 rounded-2xl bg-card p-4 shadow-portal md:grid-cols-[1fr_1fr_auto]", !g.active && "opacity-60")} data-testid="guideline-row">
          <div className="space-y-1">
            <input aria-label={ct("Title (FR)")} className={cn(f, "font-bold")} defaultValue={g.title_fr} onBlur={(e) => e.target.value !== g.title_fr && void save(g.id, { title_fr: e.target.value })} />
            <input aria-label={ct("Explanation (FR)")} className={f} defaultValue={g.body_fr} placeholder={ct("Explication en une ligne")} onBlur={(e) => e.target.value !== g.body_fr && void save(g.id, { body_fr: e.target.value })} />
          </div>
          <div className="space-y-1">
            <input aria-label={ct("Title (EN)")} className={cn(f, "font-bold")} defaultValue={g.title_en} onBlur={(e) => e.target.value !== g.title_en && void save(g.id, { title_en: e.target.value })} />
            <input aria-label={ct("Explanation (EN)")} className={f} defaultValue={g.body_en} placeholder={ct("One-line explanation")} onBlur={(e) => e.target.value !== g.body_en && void save(g.id, { body_en: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
            <select aria-label={ct("App")} className="h-9 rounded-lg border bg-card px-2 text-sm" value={g.app_id ?? ""} onChange={(e) => void save(g.id, { app_id: e.target.value || null })}><option value="">{ct("Both apps")}</option><option value={SOPHIA_APP_ID}>{ct("Sophia")}</option><option value={UNSWIPE}>{ct("UnSwipe")}</option></select>
            <label className="inline-flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={g.active} onChange={(e) => void save(g.id, { active: e.target.checked })} />{ct("On")}</label>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label={ct("Move up")} disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={ct("Move down")} disabled={i === data.length - 1} onClick={() => void move(i, 1)}><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={ct("Delete guideline")} onClick={async () => { if (!window.confirm(`Delete "${g.title_fr}"?`)) return; await supabase.from("ugc_guidelines").delete().eq("id", g.id); reload(); }}><Trash2 className="size-4" /></Button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:col-span-3">
            {g.image_data ? <img src={g.image_data} alt="" className="size-10 rounded-lg object-cover" /> : null}
            <label className="cursor-pointer text-xs font-bold text-portal-accent">{g.image_data ? "Change example image" : "Add example image (optional)"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => void image(g.id, e.target.files?.[0])} /></label>
            {g.image_data ? <button type="button" className="text-xs text-brand-navySoft underline" onClick={() => void save(g.id, { image_data: null })}>{ct("Remove")}</button> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
