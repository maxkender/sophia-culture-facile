import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { DeleteConfirm } from "@/components/hub/DeleteConfirm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { accountAvatars, deleteInspirationAccounts, refreshInspirationAccount } from "@/lib/notion.functions";

export type InspirationAccount = { id: string; platform: string; handle: string; url: string; display_name: string | null; avatar_path: string | null; followers: number | null; notes: string | null; app_ids: string[]; error: string | null };

export function useInspirationAccounts() {
  return useQuery({ queryKey: ["hub", "inspiration-accounts"], queryFn: async () => ((await supabase.from("inspiration_accounts").select("id, platform, handle, url, display_name, avatar_path, followers, notes, app_ids, error").order("created_at")).data ?? []) as InspirationAccount[] });
}

const fmt = (n: number | null) => (n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n));

function RefreshBtn({ id }: { id: string }) {
  const run = useServerFn(refreshInspirationAccount); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  return <button type="button" aria-label="Refresh" disabled={busy} className="inline-flex items-center gap-1 text-xs font-bold text-portal-accent" onClick={async () => {
    setBusy(true); try { await run({ data: { id } }); toast.success("Refreshed"); } catch (e) { toast.error((e as Error).message); }
    setBusy(false); void qc.invalidateQueries({ queryKey: ["hub", "inspiration-accounts"] });
  }}>{busy ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}Refresh</button>;
}

export function AccountsTab() {
  const { data: rows = [], isLoading } = useInspirationAccounts();
  const sign = useServerFn(accountAvatars);
  const paths = rows.map((r) => r.avatar_path).filter(Boolean) as string[];
  const del = useServerFn(deleteInspirationAccounts); const qc = useQueryClient();
  const [sel, setSel] = useState<Set<string>>(new Set()); const [delIds, setDelIds] = useState<string[] | null>(null);
  const { data: pics = {} } = useQuery({ queryKey: ["hub", "account-avatars", paths], enabled: paths.length > 0, queryFn: () => sign({ data: { paths } }) });
  return (
    <div className="space-y-2">
    {sel.size ? <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2 text-sm"><b className="px-1 text-brand-navy">{sel.size} selected</b><Button size="sm" variant="outline" className="text-destructive" onClick={() => setDelIds([...sel])}><Trash2 className="size-4" />Delete selected</Button><Button size="sm" variant="ghost" onClick={() => setSel(new Set())}>Clear</Button></div> : null}
    <DeleteConfirm open={Boolean(delIds)} onOpenChange={(o) => !o && setDelIds(null)} title={`Delete ${delIds?.length ?? 0} account(s)?`} onConfirm={async (archiveNotion) => { await del({ data: { ids: delIds ?? [], archiveNotion } }); toast.success("Deleted"); setSel(new Set()); void qc.invalidateQueries({ queryKey: ["hub", "inspiration-accounts"] }); void qc.invalidateQueries({ queryKey: ["hub", "notion-items"] }); }} />
    <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="w-8 p-3"><input type="checkbox" aria-label="Select all" checked={rows.length > 0 && sel.size === rows.length} onChange={(e) => setSel(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th><th className="p-3">Account</th><th className="p-3">Platform</th><th className="p-3">Followers</th><th className="p-3">App</th><th className="p-3">Notion notes</th><th className="p-3" /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t border-brand-line">
            <td className="p-3"><input type="checkbox" aria-label={`Select @${r.handle}`} checked={sel.has(r.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(r.id); else n.delete(r.id); setSel(n); }} /></td>
            <td className="p-3"><div className="flex items-center gap-2">
              {r.avatar_path && pics[r.avatar_path] ? <img src={pics[r.avatar_path]} alt="" loading="lazy" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-bold text-brand-navy">{r.handle.slice(0, 2).toUpperCase()}</span>}
              <div><p className="font-bold text-brand-navy">@{r.handle}</p>{r.display_name ? <p className="text-xs text-brand-navySoft">{r.display_name}</p> : null}</div>
            </div></td>
            <td className="p-3">{r.platform === "tiktok" ? "TikTok" : "Instagram"}</td>
            <td className="p-3">{fmt(r.followers)}</td>
            <td className="p-3">{r.app_ids.length ? r.app_ids.map((a) => <span key={a} className="mr-1 rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{a}</span>) : "—"}</td>
            <td className="max-w-[260px] p-3 text-xs text-brand-navySoft">{r.notes ?? ""}{r.error ? <span className="block text-portal-red">{r.error}</span> : null}</td>
            <td className="whitespace-nowrap p-3 text-right"><a href={r.url} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">Open <ExternalLink className="size-3" /></a><RefreshBtn id={r.id} /><button type="button" aria-label={`Delete @${r.handle}`} className="ml-3 inline-flex text-destructive" onClick={() => setDelIds([r.id])}><Trash2 className="size-4" /></button></td>
          </tr>))}</tbody>
      </table>
      {isLoading ? <p className="p-5 text-sm">Loading…</p> : !rows.length ? <p className="p-5 text-sm text-brand-navySoft">No accounts yet. Profile links added in Notion appear here after a sync.</p> : null}
    </div>
    </div>
  );
}
