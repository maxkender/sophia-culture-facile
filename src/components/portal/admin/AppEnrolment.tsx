import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApps } from "@/lib/apps";
import { PortalCard } from "../ui";

/** Admin enrols a creator or influencer in each app: one checkbox per app. */
export function AppEnrolment({ kind, personId }: { kind: "creator" | "influencer"; personId: string }) {
  const qc = useQueryClient();
  const { data: apps } = useApps();
  const table = kind === "creator" ? "creator_apps" : "influencer_apps";
  const col = kind === "creator" ? "creator_id" : "influencer_id";
  const key = ["admin-enrolment", kind, personId];
  const { data: rows } = useQuery({
    queryKey: key,
    queryFn: async () => ((await (supabase.from(table) as any).select("app_id, status, enrolled_at").eq(col, personId)).data ?? []) as { app_id: string; status: string; enrolled_at: string }[],
  });
  async function toggle(appId: string, on: boolean) {
    const q = supabase.from(table) as any;
    const { error } = on
      ? await q.upsert({ [col]: personId, app_id: appId, status: "active" }, { onConflict: `${col},app_id` })
      : await q.update({ status: "paused" }).eq(col, personId).eq("app_id", appId);
    if (error) toast.error("Could not change the enrolment.");
    else toast.success(on ? "Enrolled." : "Paused for this app.");
    void qc.invalidateQueries({ queryKey: key });
  }
  return (
    <PortalCard>
      <p className="text-xs font-bold uppercase tracking-wide text-brand-navySoft">Apps</p>
      <p className="mt-1 text-sm text-brand-navySoft">Briefs are only shown for apps ticked here.</p>
      <ul className="mt-3 space-y-1">
        {(apps ?? []).map((a) => {
          const row = rows?.find((r) => r.app_id === a.id);
          const on = row?.status === "active";
          return (
            <li key={a.id}>
              <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-brand-navy">
                <input type="checkbox" className="size-5" checked={on} onChange={(e) => void toggle(a.id, e.target.checked)} aria-label={`Enrolled in ${a.name}`} />
                {a.name}
                {row ? <span className="text-xs font-normal text-brand-navySoft">{on ? "active" : "paused"} · since {new Date(row.enrolled_at).toLocaleDateString()}</span> : null}
              </label>
            </li>
          );
        })}
      </ul>
    </PortalCard>
  );
}
