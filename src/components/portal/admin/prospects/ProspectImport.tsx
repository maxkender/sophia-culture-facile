import { useMemo, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SOURCES, TRACKS, type Prospect } from "./model";

const TARGETS: { key: string; label: string; match: RegExp }[] = [
  { key: "name", label: "Full name", match: /^(full.?name|name|nom|prénom|first.?name)$/i },
  { key: "email", label: "Email", match: /e-?mail|courriel/i },
  { key: "phone", label: "Phone", match: /phone|tel|whatsapp/i },
  { key: "country", label: "Country", match: /country|pays/i },
  { key: "language", label: "Language", match: /lang/i },
  { key: "track", label: "Track wanted", match: /track|piste/i },
  { key: "followers", label: "Followers", match: /follower|abonn/i },
  { key: "tiktok_handle", label: "TikTok", match: /tiktok/i },
  { key: "instagram_handle", label: "Instagram", match: /insta/i },
  { key: "source", label: "Source", match: /^source$/i },
  { key: "status", label: "Status", match: /^status|statut/i },
  { key: "age", label: "Age", match: /^age$|âge/i },
  { key: "device", label: "Device", match: /device|phone.?type|appareil/i },
  { key: "presentation", label: "Presentation", match: /presentation|about|motivation|bio/i },
  { key: "notes", label: "Notes", match: /note|comment/i },
];

type Row = Record<string, unknown> & { name?: unknown; email?: unknown; phone?: unknown; country?: unknown; language?: unknown; track?: unknown; followers?: unknown; tiktok_handle?: unknown; instagram_handle?: unknown; source?: unknown; status?: unknown; age?: unknown; device?: unknown; presentation?: unknown; notes?: unknown };
type FRow = Record<string, string> & { name?: string; email?: string; phone?: string; country?: string; language?: string; track?: string; followers?: string; tiktok_handle?: string; instagram_handle?: string; source?: string; status?: string; age?: string; device?: string; presentation?: string; notes?: string };
type Existing = Pick<Prospect, "email" | "tiktok_handle" | "instagram_handle" | "handle">;
const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/^@/, "");

export function ProspectImport({ open, onOpenChange, existing, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; existing: Existing[]; onDone: () => void }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function load(text: string) {
    const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true });
    const hs = (parsed.meta.fields ?? []).filter(Boolean);
    setHeaders(hs);
    setRows(parsed.data);
    setResult(null);
    const auto: Record<string, string> = {};
    for (const h of hs) {
      const t = TARGETS.find((x) => x.match.test(h.trim()) && !Object.values(auto).includes(x.key));
      auto[h] = t?.key ?? "";
    }
    setMap(auto);
  }

  const mapped = useMemo(() => {
    const out = rows.map((r) => {
      const o: Row = {};
      for (const [h, k] of Object.entries(map)) {
        if (!k) continue;
        const v = (r[h] ?? "").trim();
        if (!v) continue;
        o[k] = o[k] && k === "notes" ? `${o[k]}\n${v}` : v;
      }
      if (o.followers) o.followers = Number(String(o.followers).replace(/\D/g, "")) || null;
      if (o.age) o.age = Number(String(o.age).replace(/\D/g, "")) || null;
      if (o.track && !(TRACKS as readonly string[]).includes(String(o.track).toLowerCase())) o.track = null;
      else if (o.track) o.track = String(o.track).toLowerCase();
      o.source = o.source && (SOURCES as readonly string[]).includes(String(o.source)) ? o.source : "manual";
      if (o.email) o.email = String(o.email).toLowerCase();
      return o;
    });
    const emails = new Set(existing.map((e) => norm(e.email)).filter(Boolean));
    const handles = new Set(existing.flatMap((e) => [e.tiktok_handle, e.instagram_handle, e.handle]).map(norm).filter(Boolean));
    const fresh: Row[] = [];
    let dup = 0;
    for (const o of out) {
      const e = norm(o.email);
      const hs = [o.tiktok_handle, o.instagram_handle].map(norm).filter(Boolean);
      if ((e && emails.has(e)) || hs.some((h) => handles.has(h))) { dup++; continue; }
      if (!e && !hs.length && !o.name) { dup++; continue; }
      if (e) emails.add(e);
      hs.forEach((h) => handles.add(h));
      fresh.push(o);
    }
    return { fresh, dup, noEmail: out.filter((o) => !o.email).length };
  }, [rows, map, existing]);

  async function run() {
    setBusy(true);
    let created = 0, errors = 0;
    for (let i = 0; i < mapped.fresh.length; i += 500) {
      const chunk = mapped.fresh.slice(i, i + 500);
      const { error } = await supabase.from("creator_prospects").insert(chunk as never);
      if (error) errors += chunk.length; else created += chunk.length;
    }
    setBusy(false);
    const line = `${created} created, ${mapped.dup} skipped, ${errors} errors.`;
    setResult(line);
    toast.success(line);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>Import prospects</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 font-semibold text-brand-navy">
              1. Upload a CSV
              <Input type="file" accept=".csv,text/csv,.tsv,text/plain" onChange={async (e) => { const f = e.target.files?.[0]; if (f) load(await f.text()); }} />
            </label>
            <div className="space-y-1">
              <p className="font-semibold text-brand-navy">…or paste from a spreadsheet (with header row)</p>
              <Textarea rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} />
              <Button size="sm" variant="outline" onClick={() => load(paste)} disabled={!paste.trim()}>Read pasted rows</Button>
            </div>
          </div>
          {headers.length ? (
            <>
              <p className="font-semibold text-brand-navy">2. Map your columns (first five rows shown)</p>
              <div className="overflow-x-auto rounded-lg border border-brand-line">
                <table className="text-xs">
                  <thead className="bg-brand-surface">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="min-w-36 p-2 text-left align-top">
                          <p className="mb-1 font-bold">{h}</p>
                          <select className="h-7 w-full rounded border border-brand-line bg-card" value={map[h] ?? ""} onChange={(e) => setMap((m) => ({ ...m, [h]: e.target.value }))}>
                            <option value="">Ignore</option>
                            {TARGETS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t border-brand-line">
                        {headers.map((h) => <td key={h} className="max-w-48 truncate p-2">{r[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="font-semibold text-brand-navy">3. Preview</p>
              <p>{rows.length} rows · {mapped.dup} will be skipped as duplicates (email or handle) · {mapped.noEmail} have no email · <b>{mapped.fresh.length} will be created</b></p>
              <Button onClick={() => void run()} disabled={busy || !mapped.fresh.length}>{busy ? "Importing…" : `4. Import ${mapped.fresh.length}`}</Button>
              {result ? <p className="font-bold text-portal-green">{result}</p> : null}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddOneDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [f, setF] = useState<FRow>({});
  async function save() {
    if (!f.email && !f.tiktok_handle && !f.instagram_handle) return toast.error("Add an email or a handle.");
    const row: Row = { ...f, source: f.source || "manual", email: f.email?.toLowerCase() || null };
    if (f.followers) row.followers = Number(f.followers);
    const { error } = await supabase.from("creator_prospects").insert(row as never);
    if (error) return toast.error(error.message);
    toast.success("Prospect added.");
    setF({});
    onOpenChange(false);
    return onDone();
  }
  const field = (k: string, label: string, type = "text") => (
    <label className="space-y-1 text-xs font-semibold text-brand-navySoft">{label}<Input type={type} value={f[k] ?? ""} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} /></label>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add one prospect</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {field("name", "Full name")}{field("email", "Email", "email")}{field("country", "Country")}{field("language", "Language")}
          {field("tiktok_handle", "TikTok")}{field("instagram_handle", "Instagram")}{field("followers", "Followers", "number")}
          <label className="space-y-1 text-xs font-semibold text-brand-navySoft">Track
            <select className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm" value={f.track ?? ""} onChange={(e) => setF((x) => ({ ...x, track: e.target.value }))}>
              <option value="">—</option>{TRACKS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <Button onClick={() => void save()}>Add</Button>
      </DialogContent>
    </Dialog>
  );
}
