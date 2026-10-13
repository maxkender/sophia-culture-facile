import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useApps } from "@/lib/apps";

type Platform = "ios" | "android";
const card = "rounded-2xl bg-card p-5 shadow-portal";

/** Store codes per app and platform (Sophia iOS, Sophia Android, UnSwipe iOS…), with a CSV import that picks both. */
export function HubAccessCodes() {
  const qc = useQueryClient();
  const { data: apps = [] } = useApps();
  const [appId, setAppId] = useState("00000000-0000-4000-8000-000000000001");
  const [platform, setPlatform] = useState<Platform>("ios");
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: counts = [] } = useQuery({
    queryKey: ["hub", "codes", "counts", apps.map((a) => a.id).join()],
    enabled: apps.length > 0,
    queryFn: async () => {
      const c = async (appId: string, p: Platform, state: "available" | "assigned") => (await supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("app_id", appId).eq("platform", p).eq("state", state)).count ?? 0;
      const combos = apps.flatMap((a) => (["ios", "android"] as Platform[]).map((p) => ({ a, p })));
      const rows = await Promise.all(combos.map(async ({ a, p }) => {
        const [available, assigned] = await Promise.all([c(a.id, p, "available"), c(a.id, p, "assigned")]);
        return { app: a.name, appId: a.id, platform: p, available, assigned, keep: available > 0 || assigned > 0 || a.slug === "sophia" };
      }));
      return rows.filter((r) => r.keep);
    },
  });
  async function importCsv() {
    const seen = new Set<string>();
    const rows = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.toLowerCase().startsWith("code,"))
      .map((l) => l.split(",").map((x) => x.trim())).filter(([c]) => c && !seen.has(c) && seen.add(c))
      .map(([code, url]) => ({ code: code!, redeem_url: url || null, platform, app_id: appId, state: "available" as const, batch_label: `hub-${new Date().toISOString().slice(0, 10)}` }));
    if (!rows.length) { toast.error("No codes found in that list."); return; }
    setBusy(true);
    try {
      let added = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const { data, error } = await supabase.from("access_codes").upsert(rows.slice(i, i + 500), { onConflict: "code", ignoreDuplicates: true }).select("id");
        if (error) throw error;
        added += data?.length ?? 0;
      }
      toast.success(`${added} new code(s) added, ${rows.length - added} already in the pool.`); setCsv("");
      void qc.invalidateQueries({ queryKey: ["hub", "codes"] });
    } catch { toast.error("The codes could not be imported."); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[480px] text-sm" data-testid="codes-per-app">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">App</th><th className="p-3">Platform</th><th className="p-3">Available</th><th className="p-3">Assigned</th></tr></thead>
          <tbody>{counts.map((r) => <tr key={`${r.appId}-${r.platform}`} className="border-t border-brand-line"><td className="p-3 font-bold">{r.app}</td><td className="p-3">{r.platform === "ios" ? "iOS" : "Android"}</td><td className="p-3">{r.available.toLocaleString()}{r.available < 20 ? <span className="ml-2 rounded-full bg-portal-amber/20 px-2 py-0.5 text-xs font-bold text-brand-navy" data-testid="codes-low">Low: under 20 left — import more</span> : null}</td><td className="p-3">{r.assigned.toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
      <div className={`${card} space-y-3`}>
        <h3 className="font-extrabold text-brand-navy">Import codes (CSV)</h3>
        <p className="text-sm text-brand-navySoft">One code per line, optionally followed by a comma and its redeem link. Creators receive a code of the app their job belongs to.</p>
        <div className="flex flex-wrap gap-2">
          <select aria-label="App" value={appId} onChange={(e) => setAppId(e.target.value)} className="h-10 rounded-lg border px-2 text-sm">{apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select aria-label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="h-10 rounded-lg border px-2 text-sm"><option value="ios">iOS</option><option value="android">Android</option></select>
        </div>
        <textarea aria-label="Codes" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} className="w-full rounded-xl border p-3 font-mono text-xs" placeholder="ABCD1234EFGH,https://apps.apple.com/redeem?code=ABCD1234EFGH" />
        <Button disabled={busy || !csv.trim()} onClick={() => void importCsv()}>{busy ? "Importing…" : "Import"}</Button>
      </div>
    </div>
  );
}
