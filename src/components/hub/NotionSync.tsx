import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notionImportMore, notionStatus, notionSyncNow, notionTest } from "@/lib/notion.functions";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const f = "h-9 rounded-lg border bg-card px-2 text-sm";
const when = (s: string | null) => (s ? new Date(s).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "never");

export function useNotionStatus() {
  const st = useServerFn(notionStatus);
  return useQuery({ queryKey: ["hub", "notion-status"], queryFn: () => st() });
}

function SyncButton() {
  const run = useServerFn(notionSyncNow); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  return <Button size="sm" disabled={busy} onClick={async () => {
    setBusy(true);
    try { const r = await run(); if (r["skipped"]) toast.message(String(r["skipped"])); else toast.success(`Synced: ${r["pulled"] ?? 0} rows read · ${r["imported"] ?? 0} new · ${r["profiles"] ?? 0} profiles · ${r["pushed"] ?? 0} pushed`); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false); void qc.invalidateQueries({ queryKey: ["hub", "notion-status"] }); void qc.invalidateQueries({ queryKey: ["hub", "notion-items"] }); void qc.invalidateQueries({ queryKey: ["hub", "inspirations"] });
  }}>{busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Sync now</Button>;
}

/** Settings → Notion (UGC). */
export function NotionSettingsCard() {
  const { data: s, refetch } = useNotionStatus(); const test = useServerFn(notionTest);
  const [db, setDb] = useState(""); const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (s) setDb(s.databaseId); }, [s?.databaseId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return <p className="text-sm text-brand-navySoft">Loading…</p>;
  return (
    <div className={cn(card, "space-y-4")} data-testid="notion-card">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold text-brand-navy">Notion · Inspiration database</h3>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", s.connected ? "bg-portal-green/15 text-portal-green" : "bg-portal-red/10 text-portal-red")}>{s.connected ? "Token set" : "Not connected — add NOTION_TOKEN"}</span></div>
      <p className="text-xs text-brand-navySoft">Video links in Notion are imported into Inspiration; profile links import their top videos by views, one profile at a time. The Hub writes back only Statut Hub, Score /10, Hook, Analyse Hub, and Type de format / App when they are empty.</p>
      <label className="block text-xs font-bold text-brand-navy">Database id
        <input aria-label="Notion database id" className={cn(f, "mt-1 w-full font-mono")} value={db} onChange={(e) => setDb(e.target.value)} onBlur={async () => { if (db.trim() && db !== s.databaseId) { await supabase.from("ugc_settings").update({ notion_database_id: db.trim() } as never).eq("id", 1); void refetch(); } }} /></label>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={async () => { setBusy(true); const r = await test({ data: { databaseId: db.trim() } }); setRes(r.ok ? { ok: true, text: `“${r.title}” · ${r.properties.length} properties: ${r.properties.join(", ")}` } : { ok: false, text: r.error }); setBusy(false); }}>Test connection</Button>
        <SyncButton />
        <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={s.auto} onChange={async (e) => { await supabase.from("ugc_settings").update({ notion_auto: e.target.checked } as never).eq("id", 1); void refetch(); }} />Auto-sync every 10 min</label>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold text-brand-navy">Videos per profile
        <input aria-label="Videos per profile" type="number" min={1} max={30} className={cn(f, "w-20")} defaultValue={s.perProfile} onBlur={async (e) => { const v = Math.max(1, Math.min(30, Number(e.target.value) || 10)); await supabase.from("ugc_settings").update({ notion_videos_per_profile: v } as never).eq("id", 1); void refetch(); }} /></label>
      {res ? <p className={cn("rounded-lg p-2 text-sm", res.ok ? "bg-portal-green/10 text-portal-green" : "bg-portal-red/10 text-portal-red")}>{res.ok ? "✓ " : "✗ "}{res.text}</p> : null}
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        <div><p className="text-xs text-brand-navySoft">Last sync</p><b>{when(s.lastSync)}</b></div>
        <div><p className="text-xs text-brand-navySoft">Imported</p><b>{s.counts.imported}</b></div>
        <div><p className="text-xs text-brand-navySoft">Analyzed</p><b>{s.counts.analyzed}</b></div>
        <div><p className="text-xs text-brand-navySoft">Profiles</p><b>{s.counts.profilesDone}/{s.counts.profiles} done · {s.counts.profileVideos} videos{s.counts.profilesPending ? ` · ${s.counts.profilesPending} in queue` : ""}</b></div>
        <div><p className="text-xs text-brand-navySoft">Errors</p><b className={s.counts.errors ? "text-portal-red" : ""}>{s.counts.errors}</b></div>
      </div>
      {s.lastError ? <p className="text-xs text-portal-red">Last error: {s.lastError}</p> : null}
    </div>
  );
}

type Item = { notion_page_id: string; url: string | null; kind: string; hub_status: string | null; error: string | null; inspiration_id: string | null; imported_count: number; profile_status: string | null; inspirations: { score: number | null } | null };

/** Inspiration → Notion tab. */
export function NotionItemsTab({ onOpen }: { onOpen: (id: string) => void }) {
  const { data: s } = useNotionStatus();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["hub", "notion-items"], queryFn: async () => ((await supabase.from("notion_items").select("notion_page_id, url, kind, hub_status, error, inspiration_id, imported_count, profile_status, inspirations(score)").order("created_at", { ascending: false })).data ?? []) as unknown as Item[] });
  const more = useServerFn(notionImportMore); const qc = useQueryClient();
  const [kind, setKind] = useState("all"); const [status, setStatus] = useState("all");
  const statuses = [...new Set(items.map((i) => i.hub_status).filter(Boolean))] as string[];
  const rows = useMemo(() => items.filter((i) => (kind === "all" || i.kind === kind) && (status === "all" || i.hub_status === status)), [items, kind, status]);
  return (
    <div className="space-y-3">
      <div className={cn(card, "flex flex-wrap items-center gap-2")}>
        <select aria-label="Kind" className={f} value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All kinds</option><option value="video">Video</option><option value="profile">Profile</option><option value="other">Other</option></select>
        <select aria-label="Hub status" className={f} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Any Hub status</option>{statuses.map((x) => <option key={x}>{x}</option>)}</select>
        <span className="text-xs text-brand-navySoft">Last sync {when(s?.lastSync ?? null)}{s && !s.connected ? " · Not connected — add NOTION_TOKEN" : ""}</span>
        <div className="ml-auto"><SyncButton /></div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Link</th><th className="p-3">Kind</th><th className="p-3">Hub status</th><th className="p-3">Score</th><th className="p-3">Error</th><th className="p-3" /></tr></thead>
          <tbody>{rows.map((i) => (
            <tr key={i.notion_page_id} className="border-t border-brand-line">
              <td className="max-w-[280px] truncate p-3"><a href={i.url ?? "#"} target="_blank" rel="noreferrer" className="text-brand-blue">{i.url || "—"}</a></td>
              <td className="p-3">{i.kind}{i.kind === "profile" && i.imported_count ? ` · ${i.imported_count} videos` : ""}</td><td className="p-3">{i.hub_status ?? "—"}</td><td className="p-3">{i.inspirations?.score != null ? `${i.inspirations.score}/10` : "—"}</td>
              <td className="max-w-[220px] p-3 text-xs text-portal-red">{i.error ?? ""}</td>
              <td className="whitespace-nowrap p-3 text-right"><a href={`https://www.notion.so/${i.notion_page_id.replace(/-/g, "")}`} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">Open in Notion <ExternalLink className="size-3" /></a>{i.kind === "profile" && i.profile_status !== "queued" && i.profile_status !== "running" ? <button type="button" className="mr-3 text-xs font-bold text-portal-accent" onClick={async () => { try { await more({ data: { pageId: i.notion_page_id } }); toast.success("Queued"); void qc.invalidateQueries({ queryKey: ["hub", "notion-items"] }); } catch (e) { toast.error((e as Error).message); } }}>Import more</button> : null}{i.inspiration_id ? <button type="button" className="text-xs font-bold text-portal-accent" onClick={() => onOpen(i.inspiration_id!)}>Open fiche</button> : null}</td>
            </tr>))}</tbody>
        </table>
        {isLoading ? <p className="p-5 text-sm">Loading…</p> : !rows.length ? <p className="p-5 text-sm text-brand-navySoft">{items.length ? "Nothing matches these filters." : "No Notion rows yet. Add NOTION_TOKEN, share the Notion page with the integration, then Sync now."}</p> : null}
      </div>
    </div>
  );
}
