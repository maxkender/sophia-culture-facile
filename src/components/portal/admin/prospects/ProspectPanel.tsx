import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "./ProspectGrid";
import { CHANNELS, SOURCES, STATUSES, TRACKS, countryLabel, type Enriched, type Hm, type Prospect, type Template, type Touch } from "./model";

type Props = {
  prospect: Enriched;
  touches: Touch[];
  hms: Hm[];
  templates: Template[];
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onSave: (patch: Partial<Prospect>) => Promise<boolean>;
  onLog: (channel: string, message: string) => Promise<boolean>;
  onTemplatesChanged: () => void;
};

const FIELDS: { key: keyof Prospect; label: string; type?: "number" | "date" | "select" | "area"; options?: readonly string[] }[] = [
  { key: "name", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "country", label: "Country" },
  { key: "language", label: "Language" },
  { key: "track", label: "Track wanted", type: "select", options: TRACKS },
  { key: "followers", label: "Followers", type: "number" },
  { key: "tiktok_handle", label: "TikTok handle" },
  { key: "instagram_handle", label: "Instagram handle" },
  { key: "source", label: "Source", type: "select", options: SOURCES },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "next_action_on", label: "Next action", type: "date" },
  { key: "age", label: "Age", type: "number" },
  { key: "device", label: "Device" },
  { key: "presentation", label: "Presentation", type: "area" },
  { key: "notes", label: "Notes", type: "area" },
];

export function ProspectPanel({ prospect, touches, hms, templates, onClose, onStep, onSave, onLog, onTemplatesChanged }: Props) {
  const [channel, setChannel] = useState<string>("email");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.getAttribute("role") === "grid") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); onStep(1); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); onStep(-1); }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStep, onClose]);

  function saveField(key: keyof Prospect, raw: string, type?: string) {
    const current = prospect[key];
    const v = raw.trim();
    if (v === (current == null ? "" : String(current))) return;
    const value = type === "number" ? (v ? Number(v) : null) : v || null;
    if (key === "status" || key === "source") {
      if (!v) return;
    }
    void onSave({ [key]: value } as Partial<Prospect>);
  }

  function fillTemplate(t: Template) {
    const first = (prospect.name ?? "").split(" ")[0] || "";
    setChannel(t.channel);
    setMessage(t.body.replace(/\{first_name\}/g, first).replace(/\{name\}/g, prospect.name ?? "").replace(/\{track\}/g, prospect.track ?? ""));
  }

  async function saveTemplate() {
    const name = window.prompt("Template name");
    if (!name || !message.trim()) return;
    const { error } = await supabase.from("prospect_templates").insert({ name, channel, body: message });
    if (error) return toast.error(error.message);
    toast.success("Template saved. Use {first_name}, {name}, {track} as placeholders.");
    return onTemplatesChanged();
  }

  return (
    <aside
      key={prospect.id}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-brand-line bg-card shadow-2xl"
      aria-label="Prospect detail"
    >
      <div className="flex items-center gap-2 border-b border-brand-line p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-brand-navy">{prospect.name || prospect.email}</p>
          <p className="text-xs text-brand-navySoft">
            <StatusPill status={prospect.status} /> {countryLabel(prospect.country)}
          </p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Previous prospect" onClick={() => onStep(-1)}><ChevronUp className="size-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Next prospect" onClick={() => onStep(1)}><ChevronDown className="size-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}><X className="size-4" /></Button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section className="grid grid-cols-2 gap-2">
          {FIELDS.map((f) => {
            const val = prospect[f.key] == null ? "" : String(prospect[f.key]);
            const cls = f.type === "area" ? "col-span-2" : "";
            return (
              <label key={f.key} className={`space-y-0.5 text-xs font-semibold text-brand-navySoft ${cls}`}>
                {f.label}
                {f.type === "select" ? (
                  <select className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-brand-navy" defaultValue={val} onChange={(e) => saveField(f.key, e.target.value, f.type)}>
                    <option value="">—</option>
                    {f.options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "area" ? (
                  <Textarea rows={3} defaultValue={val} onBlur={(e) => saveField(f.key, e.target.value)} />
                ) : (
                  <Input type={f.type ?? "text"} defaultValue={val} onBlur={(e) => saveField(f.key, e.target.value, f.type)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
                )}
              </label>
            );
          })}
          <label className="space-y-0.5 text-xs font-semibold text-brand-navySoft">
            Assigned HM
            <select className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-brand-navy" defaultValue={prospect.assigned_hm_id ?? ""} onChange={(e) => void onSave({ assigned_hm_id: e.target.value || null })}>
              <option value="">—</option>
              {hms.map((h) => <option key={h.id} value={h.id}>{h.full_name}</option>)}
            </select>
          </label>
          <label className="space-y-0.5 text-xs font-semibold text-brand-navySoft">
            Tags (comma separated)
            <Input defaultValue={(prospect.tags ?? []).join(", ")} onBlur={(e) => void onSave({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </label>
        </section>

        <section className="space-y-2 rounded-xl bg-brand-surface p-3">
          <p className="text-sm font-bold text-brand-navy">Log a touch</p>
          <div className="flex gap-2">
            <select className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
              {[...CHANNELS, "reply"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="h-9 flex-1 rounded-md border border-input bg-card px-2 text-sm" value="" onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); if (t) fillTemplate(t); }}>
              <option value="">Use a template…</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What you sent, or what they replied (pick channel “reply”)" />
          <div className="flex justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={() => void saveTemplate()}>Save as template</Button>
            <Button size="sm" onClick={async () => { if (!message.trim()) return toast.error("Write what you sent."); if (await onLog(channel, message.trim())) setMessage(""); }}>Log touch</Button>
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-bold text-brand-navy">History ({touches.length})</p>
          {touches.length === 0 ? <p className="text-xs text-brand-navySoft">No touches yet.</p> : (
            <ol className="space-y-2">
              {touches.map((t) => (
                <li key={t.id} className="rounded-lg border border-brand-line p-2 text-xs">
                  <p className="font-bold text-brand-navy">{new Date(t.created_at).toLocaleString("en-GB")} · {t.channel}</p>
                  <p className="whitespace-pre-wrap text-brand-navySoft">{t.message}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </aside>
  );
}
