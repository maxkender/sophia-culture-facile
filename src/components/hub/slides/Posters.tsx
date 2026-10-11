import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { refreshFromOs } from "@/lib/slideshows.functions";
import { OS_NOT_CONNECTED, OS_UI_ENABLED, POSTER_STATUSES, STATUS_LABEL, useOsStatus } from "./useOs";

const mondayOf = (d = new Date()) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };

export function OsNotConnected({ what }: { what: string }) {
  if (!OS_UI_ENABLED) return null;
  return <div className="rounded-2xl border border-dashed border-brand-line bg-card p-4 text-sm text-brand-navySoft" data-testid="os-not-connected"><b className="text-brand-navy">{what}:</b> {OS_NOT_CONNECTED}.</div>;
}

export function Posters() {
  const qc = useQueryClient();
  const os = useOsStatus();
  const refresh = useServerFn(refreshFromOs);
  const lundi = mondayOf();
  const { data } = useQuery({
    queryKey: ["hub", "slides", "posters", lundi],
    queryFn: async () => {
      const [a, s, z] = await Promise.all([
        supabase.from("slideshow_applications").select("id, full_name, email, country, zone, status, manager_name, deux_telephones, unswipe_code_id, applications, os_profile_id, start_monday, payout_method, stripe_onboarded").in("status", POSTER_STATUSES).order("full_name"),
        supabase.from("os_snapshots").select("*").eq("lundi", lundi),
        supabase.from("pay_zones").select("zone, weekly_amount"),
      ]);
      return { posters: a.data ?? [], snaps: new Map((s.data ?? []).map((x) => [x.application_id, x])), rates: Object.fromEntries((z.data ?? []).map((x) => [x.zone, x.weekly_amount])) };
    },
  });
  const connected = os.data?.connected;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {OS_UI_ENABLED ? <><p className="text-sm text-brand-navySoft">Week of {lundi} · last OS sync {os.data?.lastSync ? new Date(os.data.lastSync).toLocaleString("en-GB") : "never"} · refreshed automatically every morning at 06:30 Paris</p>
        <Button size="sm" variant="outline" className="ml-auto" disabled={!connected} onClick={async () => {
          const r = await refresh(); if (r.ok) { toast.success("Refreshed from the OS"); void qc.invalidateQueries({ queryKey: ["hub", "slides"] }); } else toast.error((r as { error?: string }).error ?? "Failed");
        }}><RefreshCw className="size-4" />Refresh from OS</Button></> : <p className="text-sm text-brand-navySoft">Week of {lundi} · posters are managed by hand (OS accounts, logins and Slack are ticked on each card).</p>}
      </div>
      {!connected ? <OsNotConnected what="Weekly post counts" /> : null}
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[900px] text-sm" data-testid="posters-table">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr>
            <th className="p-3">Poster</th><th className="p-3">Status</th><th className="p-3">Zone · rate</th><th className="p-3">Planned</th><th className="p-3">Published</th><th className="p-3">Missed</th><th className="p-3">Last post</th><th className="p-3">Manager</th><th className="p-3">2nd phone</th><th className="p-3">UnSwipe code</th><th className="p-3">Payout</th>
          </tr></thead>
          <tbody>{(data?.posters ?? []).map((p) => { const s = data?.snaps.get(p.id); return (
            <tr key={p.id} className="border-t border-brand-line">
              <td className="p-3 font-bold text-brand-navy">{p.full_name}<span className="block text-xs font-normal text-brand-navySoft">{p.country} · {(p.applications ?? []).join(", ")}</span></td>
              <td className="p-3">{STATUS_LABEL[p.status] ?? p.status}</td>
              <td className="p-3">{p.zone ?? "—"} · {data?.rates[p.zone ?? ""] != null ? `$${Number(data.rates[p.zone!])}/wk` : "—"}</td>
              <td className="p-3">{s?.prevus ?? "—"}</td><td className="p-3">{s?.publies ?? "—"}</td>
              <td className={cn("p-3", (s?.manques ?? 0) > 1 && "font-bold text-portal-red")}>{s?.manques ?? "—"}</td>
              <td className="p-3">{s?.dernier_post_at ? new Date(s.dernier_post_at).toLocaleDateString("en-GB") : "—"}</td>
              <td className="p-3">{p.manager_name ?? "—"}</td>
              <td className="p-3">{p.deux_telephones == null ? "—" : p.deux_telephones ? "Yes" : "No"}</td>
              <td className="p-3">{(p.applications ?? []).includes("unswipe") ? (p.unswipe_code_id ? "Assigned" : "Not yet") : "n/a"}</td>
              <td className="p-3">{p.payout_method ? p.payout_method : <span className="text-portal-amber">Payout method missing</span>}</td>
            </tr>); })}</tbody>
        </table>
        {!data?.posters.length ? <p className="p-5 text-sm text-brand-navySoft">No posters yet. Posters appear here once "Create the OS account" is ticked on their card.</p> : null}
      </div>
    </div>
  );
}
