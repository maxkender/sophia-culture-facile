import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApps, useAdminApp, SOPHIA_APP_ID } from "@/lib/apps";
import { STYLES, STYLE_LABEL, type BriefStyle } from "@/lib/brief-studio";
import { useSnippets } from "./StylePickers";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const f = "h-9 rounded-lg border px-2 text-sm";
const KINDS = [["hook", "Hooks"], ["body", "Bodies"], ["cta", "CTAs"]] as const;

/** Hook / Body / CTA library: snippets Max adds by hand (one by one or a pasted list). */
export function SnippetsLibrary() {
  const { data = [] } = useSnippets(); const { data: apps = [] } = useApps(); const { appId } = useAdminApp(); const qc = useQueryClient();
  const [kind, setKind] = useState<"hook" | "body" | "cta">("hook");
  const [form, setForm] = useState({ text: "", app: appId ?? SOPHIA_APP_ID, language: "fr", styles: [] as BriefStyle[], tags: "", why: "", source: "" });
  const [filter, setFilter] = useState({ q: "", app: "all", style: "all" });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "snippets"] });
  async function add() {
    const lines = form.text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const rows = lines.map((text) => ({ kind, text, app_id: form.app === "both" ? null : form.app, language: form.language, styles: form.styles, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), why: form.why || null, source_url: form.source || null }));
    const { error } = await supabase.from("brief_snippets").insert(rows as never);
    if (error) toast.error("Could not add."); else { toast.success(`${rows.length} added`); setForm({ ...form, text: "", why: "", source: "", tags: "" }); reload(); }
  }
  const list = data.filter((s) => s.kind === kind && (filter.app === "all" || (filter.app === "both" ? !s.app_id : s.app_id === filter.app || !s.app_id)) && (filter.style === "all" || !s.styles.length || s.styles.includes(filter.style)) && (!filter.q || `${s.text} ${s.tags.join(" ")} ${s.why ?? ""}`.toLowerCase().includes(filter.q.toLowerCase())));
  const appName = (id: string | null) => (id ? apps.find((a) => a.id === id)?.name ?? "—" : "Both apps");
  return (
    <div className="space-y-4">
      <div className="flex gap-1">{KINDS.map(([k, l]) => <button key={k} type="button" onClick={() => setKind(k)} className={cn("min-h-9 rounded-full px-4 text-sm font-bold", kind === k ? "bg-brand-navy text-card" : "bg-card text-brand-navy")}>{l} {data.filter((s) => s.kind === k).length}</button>)}</div>
      <div className={cn(card, "space-y-2")}>
        <p className="text-sm font-bold text-brand-navy">Add {kind === "hook" ? "hooks" : kind === "body" ? "bodies" : "CTAs"} — one per line to paste a list</p>
        <textarea aria-label="Snippet text" rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full rounded-xl border p-3 text-sm" />
        <div className="flex flex-wrap gap-2">
          <select aria-label="App" className={f} value={form.app} onChange={(e) => setForm({ ...form, app: e.target.value })}>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}<option value="both">Both apps</option></select>
          <select aria-label="Language" className={f} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="fr">French</option><option value="en">English</option></select>
          <input aria-label="Tags" className={f} placeholder="tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <input aria-label="Source link" className={f} placeholder="Source link (optional)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-1.5">{STYLES.map(([k, l], i) => { const on = form.styles.includes(k); return <button key={k} type="button" onClick={() => setForm({ ...form, styles: on ? form.styles.filter((x) => x !== k) : [...form.styles, k] })} className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", on ? "border-portal-accent bg-portal-accent/10 text-portal-accent" : "")}>{i + 1}. {l}</button>; })}</div>
        <input aria-label="Why it works" className={cn(f, "w-full")} placeholder="Why it works" value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} />
        <Button disabled={!form.text.trim()} onClick={() => void add()}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Search" className={f} placeholder="Search" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select aria-label="Filter app" className={f} value={filter.app} onChange={(e) => setFilter({ ...filter, app: e.target.value })}><option value="all">All apps</option>{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}<option value="both">Both only</option></select>
        <select aria-label="Filter style" className={f} value={filter.style} onChange={(e) => setFilter({ ...filter, style: e.target.value })}><option value="all">All formats</option>{STYLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </div>
      {!list.length ? <p className={cn(card, "text-sm text-brand-navySoft")}>Nothing here yet. Add your first {kind === "hook" ? "hook" : kind === "body" ? "body" : "CTA"} above.</p> : (
        <ul className="space-y-2">{list.map((s) => (
          <li key={s.id} className={cn(card, "flex items-start gap-3 p-4")}>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-brand-navy">{s.text}</p>
              {s.why ? <p className="text-sm text-brand-navySoft">{s.why}</p> : null}
              <p className="mt-1 text-xs text-brand-navySoft">{appName(s.app_id)} · {s.language.toUpperCase()} · {s.styles.map((x) => STYLE_LABEL[x]).join(", ") || "All formats"}{s.tags.length ? ` · ${s.tags.join(", ")}` : ""} · used {s.usage_count}×</p>
            </div>
            <Button size="icon" variant="ghost" aria-label="Copy" onClick={async () => { try { await navigator.clipboard.writeText(s.text); toast.success("Copied"); } catch { toast.error("Copy failed."); } }}><Copy className="size-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Delete" onClick={async () => { if (window.confirm("Delete this snippet?")) { await supabase.from("brief_snippets").delete().eq("id", s.id); reload(); } }}><Trash2 className="size-4" /></Button>
          </li>))}</ul>
      )}
    </div>
  );
}
