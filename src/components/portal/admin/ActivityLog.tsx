import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { EmptyState, PageTitle, PortalCard } from "../ui";

export function ActivityLog() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal", "admin", "activity"],
    queryFn: async () => {
      const [{ data: rows }, { data: authors }] = await Promise.all([
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("id, user_id, full_name"),
      ]);
      return { rows: rows ?? [], authors: authors ?? [] };
    },
  });

  const rows = data?.rows ?? [];
  const nameFor = (actorId: string | null) => {
    if (!actorId) return "System";
    const match = (data?.authors ?? []).find((a) => a.id === actorId || a.user_id === actorId);
    return match?.full_name ?? "Unknown";
  };

  return (
    <div>
      <PageTitle title="Activity log" lead="Every editorial action, most recent first." />
      {isLoading ? null : rows.length === 0 ? (
        <EmptyState title="Nothing logged yet" text="Accepting a course or requesting changes will show up here." />
      ) : (
        <PortalCard className="p-0">
          <ul className="divide-y divide-brand-line">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-4">
                <span className="text-sm font-bold text-brand-navy">{row.action}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-navySoft">{row.entity}</span>
                <span className="text-xs text-brand-navySoft">{nameFor(row.actor_id)}</span>
                <span className="ml-auto text-xs text-brand-navySoft">{formatDateTime(row.created_at)}</span>
                {row.comment ? (
                  <p className="w-full text-sm leading-relaxed text-brand-navySoft">{row.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </PortalCard>
      )}
    </div>
  );
}
