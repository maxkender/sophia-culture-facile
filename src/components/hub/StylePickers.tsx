import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Dices, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STYLE_LABEL, TEXT_FORMATS, type AssetRef, type BriefStyle, type TextFormat } from "@/lib/brief-studio";

export type LibAsset = { id: string; kind: string; title: string; thumbnail_url: string | null; tags?: string[]; folder?: string };
const field = "mt-1 block min-h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";

/** Text-format picker shared by styles 1, 3 and 5. */
export function FmtPicker({ value, onChange }: { value: TextFormat; onChange: (v: TextFormat) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
      <label className="text-xs font-semibold">Text format<select className={field} value={value.kind} onChange={(e) => onChange({ ...value, kind: e.target.value })}>{TEXT_FORMATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label className="text-xs font-semibold">Font / colour note<input className={field} value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} placeholder="e.g. white, black outline, TikTok Classic" /></label>
    </div>
  );
}

/** List of placed assets with timing + "Insert into plan" picker. */
export function PlanAssets({ value, onChange, library, single = false, label = "Assets à mettre" }: { value: AssetRef[]; onChange: (v: AssetRef[]) => void; library: LibAsset[]; single?: boolean; label?: string }) {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(""); const [pick, setPick] = useState(""); const [when, setWhen] = useState("");
  const list = useMemo(() => library.filter((a) => !q || `${a.title} ${(a.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())).slice(0, 40), [library, q]);
  const title = (id: string) => library.find((a) => a.id === id)?.title ?? "Deleted file";
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold">{label}</p>
      {value.map((r, i) => (
        <div key={`${r.asset_id}-${i}`} className="flex items-center gap-2 rounded-lg border p-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate font-bold">{title(r.asset_id)}</span>
          <input aria-label="When to show it" value={r.when} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)))} placeholder="0:04 or on the word …" className="h-8 w-44 rounded border px-1" />
          <button type="button" aria-label="Remove asset" onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-3.5" /></button>
        </div>
      ))}
      {single && value.length ? null : !open ? <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="size-3.5" />Insert from library</Button> : (
        <div className="space-y-2 rounded-xl border bg-portal-bg p-2" data-testid="asset-picker">
          <input aria-label="Search the library" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or tag" className="h-9 w-full rounded-lg border px-2 text-sm" />
          <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">{list.map((a) => (
            <button type="button" key={a.id} onClick={() => setPick(a.id)} className={cn("flex items-center gap-1.5 rounded-lg border bg-card p-1 text-left text-xs", pick === a.id && "border-portal-accent ring-2 ring-portal-accent/30")}>
              {a.thumbnail_url ? <img src={a.thumbnail_url} alt="" className="size-8 rounded object-cover" /> : <span className="flex size-8 items-center justify-center rounded bg-portal-bg text-[9px] uppercase">{a.kind}</span>}
              <span className="line-clamp-2 font-semibold">{a.title}</span>
            </button>))}{!list.length ? <p className="col-span-full text-xs text-brand-navySoft">No file matches. Upload it in Library → Assets.</p> : null}</div>
          <div className="flex gap-2"><input aria-label="Timing" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="When: 0:04 or on the word …" className="h-9 flex-1 rounded-lg border px-2 text-sm" />
            <Button type="button" size="sm" disabled={!pick} onClick={() => { onChange([...value, { asset_id: pick, when }]); setPick(""); setWhen(""); setOpen(false); }}>Insert</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
        </div>
      )}
    </div>
  );
}

type Snip = { id: string; kind: string; text: string; app_id: string | null; language: string; styles: string[]; tags: string[]; why: string | null; usage_count: number };
export function useSnippets() {
  return useQuery({ queryKey: ["hub", "snippets"], queryFn: async () => ((await supabase.from("brief_snippets").select("*").order("created_at", { ascending: false })).data ?? []) as unknown as Snip[] });
}

/** A hook / body / CTA slot with "Choose from library", "Save to library" and (hooks) "Random 3". */
export function SnippetSlot({ kind, label, value, onChange, appId, style, language, rows = 2 }: { kind: "hook" | "body" | "cta"; label: string; value: string; onChange: (v: string) => void; appId: string; style: BriefStyle | null; language: string; rows?: number }) {
  const { data = [] } = useSnippets(); const qc = useQueryClient();
  const [open, setOpen] = useState<"none" | "pick" | "random">("none"); const [q, setQ] = useState(""); const [fit, setFit] = useState(true); const [seed, setSeed] = useState(0);
  const pool = data.filter((s) => s.kind === kind && (!fit || ((!s.app_id || s.app_id === appId) && (!style || !s.styles.length || s.styles.includes(style)))));
  const shown = pool.filter((s) => !q || `${s.text} ${s.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const random = useMemo(() => [...pool].sort(() => Math.random() - 0.5).slice(0, 3), [pool.length, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  async function use(s: Snip) { onChange(s.text); setOpen("none"); await supabase.from("brief_snippets").update({ usage_count: s.usage_count + 1 }).eq("id", s.id); void qc.invalidateQueries({ queryKey: ["hub", "snippets"] }); }
  async function save() {
    if (!value.trim()) return;
    const { error } = await supabase.from("brief_snippets").insert({ kind, text: value.trim(), app_id: appId, language, styles: style ? [style] : [] } as never);
    if (error) toast.error("Could not save to the library."); else { toast.success("Saved to the library"); void qc.invalidateQueries({ queryKey: ["hub", "snippets"] }); }
  }
  const row = (s: Snip) => <button type="button" key={s.id} onClick={() => void use(s)} className="block w-full rounded-lg border bg-card p-2 text-left text-sm hover:border-portal-accent"><p className="font-semibold text-brand-navy">{s.text}</p>{s.why ? <p className="text-xs text-brand-navySoft">{s.why}</p> : null}<p className="text-[10px] text-brand-navySoft">{s.styles.map((x) => STYLE_LABEL[x]).join(" · ") || "All styles"} · used {s.usage_count}×</p></button>;
  return (
    <div>
      <label className="block text-sm font-semibold">{label}<textarea rows={rows} className={cn(field, "py-2")} value={value} onChange={(e) => onChange(e.target.value)} /></label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(open === "pick" ? "none" : "pick")}><BookOpen className="size-3.5" />Choose from library</Button>
        <Button type="button" size="sm" variant="outline" disabled={!value.trim()} onClick={() => void save()}><Save className="size-3.5" />Save to library</Button>
        {kind === "hook" ? <Button type="button" size="sm" variant="outline" onClick={() => { setSeed(seed + 1); setOpen("random"); }}><Dices className="size-3.5" />Random 3</Button> : null}
      </div>
      {open !== "none" ? (
        <div className="mt-2 space-y-1.5 rounded-xl border bg-portal-bg p-2" data-testid={`snippets-${kind}`}>
          {open === "pick" ? <div className="flex gap-2"><input aria-label="Search snippets" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 flex-1 rounded-lg border px-2 text-sm" /><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} />This app + style</label></div> : null}
          {(open === "pick" ? shown : random).map(row)}
          {!(open === "pick" ? shown : random).length ? <p className="text-xs text-brand-navySoft">Nothing in the library yet for this app and style. Add some in Library → Hooks &amp; CTAs.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
