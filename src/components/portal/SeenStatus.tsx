import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { cn } from "@/lib/utils";

export type SeenInfo = { created_at: string; read_at: string | null };

/** Change-request notifications for the given courses, newest first per course. */
export function useChangeRequestSeen(courseIds: string[]) {
  const key = [...courseIds].sort().join(",");
  return useQuery({
    queryKey: ["portal", "admin", "seen", key],
    enabled: courseIds.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, SeenInfo>> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("course_id, created_at, read_at")
        .eq("type", "changes_requested")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, SeenInfo> = {};
      for (const row of data ?? []) {
        if (row.course_id && !map[row.course_id]) {
          map[row.course_id] = { created_at: row.created_at, read_at: row.read_at };
        }
      }
      return map;
    },
  });
}

export function isStale(info: SeenInfo | undefined): boolean {
  if (!info || info.read_at) return false;
  return Date.now() - new Date(info.created_at).getTime() > 48 * 60 * 60 * 1000;
}

export function SeenBadge({ info, className }: { info: SeenInfo | undefined; className?: string }) {
  if (!info) return null;
  if (info.read_at) {
    return (
      <span className={cn("text-xs font-semibold text-portal-green", className)}>
        Author opened it {formatDateTime(info.read_at)}
      </span>
    );
  }
  const stale = isStale(info);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        stale ? "bg-portal-amber text-brand-navy" : "bg-brand-surfaceStrong text-brand-navySoft",
        className,
      )}
    >
      {stale ? "Not opened after 48h — chase on Upwork" : "Not opened yet"}
    </span>
  );
}
