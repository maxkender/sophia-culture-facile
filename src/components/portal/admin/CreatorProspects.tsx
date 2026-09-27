import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageTitle, PortalCard } from "../ui";

const STATUSES = ["new", "contacted", "replied", "applied", "declined"];

export function CreatorProspects() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [csv, setCsv] = useState("");
  const [touch, setTouch] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["portal", "admin", "prospects"],
    queryFn: async () => {
      const [p, t] = await Promise.all([
        supabase.from("creator_prospects").select("*").order("created_at", { ascending: false }),
        supabase.from("prospect_touches").select("*").order("created_at", { ascending: false }),
      ]);
      return { prospects: p.data ?? [], touches: t.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["portal", "admin", "prospects"] });

  async function importCsv() {
    const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const existing = new Set((data?.prospects ?? []).flatMap((p) => [p.handle?.toLowerCase(), p.email?.toLowerCase()]).filter(Boolean));
    const rows = lines
      .map((l) => {
        const [name, handle, email, country] = l.split(/[,;\t]/).map((x) => x?.trim() || null);
        return { name, handle, email, country };
      })
      .filter((r) => (r.handle || r.email) && !existing.has(r.handle?.toLowerCase()) && !existing.has(r.email?.toLowerCase()));
    const skipped = lines.length - rows.length;
    if (!rows.length) return toast.error(`Nothing new to import (${skipped} skipped).`);
    const { error } = await supabase.from("creator_prospects").insert(rows);
    if (error) return toast.error("Import failed.");
    setCsv("");
    toast.success(`${rows.length} imported, ${skipped} skipped.`);
    return refresh();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("creator_prospects").update({ status }).eq("id", id);
    refresh();
  }

  async function logTouch(id: string, status: string) {
    const message = touch[id]?.trim();
    if (!message) return toast.error("Write what you sent.");
    const { error } = await supabase.from("prospect_touches").insert({ prospect_id: id, message });
    if (error) return toast.error("Could not log.");
    if (status === "new") await supabase.from("creator_prospects").update({ status: "contacted" }).eq("id", id);
    setTouch((t) => ({ ...t, [id]: "" }));
    return refresh();
  }

  const prospects = (data?.prospects ?? []).filter((p) => filter === "all" || p.status === filter);
  const weekAgo = Date.now() - 7 * 864e5;
  const touchesWeek = (data?.touches ?? []).filter((t) => new Date(t.created_at).getTime() > weekAgo).length;
  const counts = Object.fromEntries(STATUSES.map((s) => [s, (data?.prospects ?? []).filter((p) => p.status === s).length]));
  const contacted = (data?.prospects ?? []).filter((p) => p.status !== "new").length;

  return (
    <div className="space-y-6">
      <PageTitle title="Prospects" lead="Creators you reach out to. Applications with the same email or handle are matched automatically." />
      <PortalCard className="grid gap-2 p-4 text-sm sm:grid-cols-3">
        <p>{STATUSES.map((s) => `${s}: ${counts[s]}`).join(" · ")}</p>
        <p>Touches this week: {touchesWeek}</p>
        <p>Contacted → applied: {contacted ? Math.round(((counts["applied"] ?? 0) / contacted) * 100) : 0}%</p>
      </PortalCard>
      <PortalCard className="space-y-2 p-4">
        <p className="text-sm font-bold text-brand-navy">Import (one per line: name, handle, email, country)</p>
        <Textarea rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Jane Doe, @jane, jane@mail.com, France" />
        <Button onClick={importCsv}>Import</Button>
      </PortalCard>
      <div className="flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>
      <PortalCard className="p-4">
        {prospects.length === 0 ? <EmptyState title="No prospects" text="Import a list to get started." /> : (
          <ul className="divide-y divide-brand-line">
            {prospects.map((p) => {
              const history = (data?.touches ?? []).filter((t) => t.prospect_id === p.id);
              return (
                <li key={p.id} className="space-y-2 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex-1 font-semibold text-brand-navy">{p.name ?? p.handle} <span className="font-normal text-brand-navySoft">{[p.handle, p.email, p.country].filter(Boolean).join(" · ")}</span></span>
                    <select className="rounded-md border px-2 py-1 text-xs" value={p.status} onChange={(e) => setStatus(p.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  {history.map((t) => <p key={t.id} className="text-xs text-brand-navySoft">{t.created_at.slice(0, 10)} — {t.message}</p>)}
                  <div className="flex gap-2">
                    <Input className="h-8" placeholder="Log a touch…" value={touch[p.id] ?? ""} onChange={(e) => setTouch((t) => ({ ...t, [p.id]: e.target.value }))} />
                    <Button size="sm" variant="outline" onClick={() => logTouch(p.id, p.status)}>Log</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PortalCard>
    </div>
  );
}
