import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NavBadge } from "./nav";

export type NavCounts = Partial<Record<NavBadge, number>>;

export function useNavCounts(isAdmin: boolean, profileId: string | null | undefined): NavCounts {
  const admin = useQuery({
    queryKey: ["portal", "nav-counts", "admin"],
    enabled: isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const count = async (
        table: "courses" | "access_codes" | "applications" | "course_requests",
        column: string,
        value: string,
      ) => {
        const { count: n } = await supabase
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq(column, value);
        return n ?? 0;
      };
      const [review, codes, applications, requests] = await Promise.all([
        count("courses", "status", "submitted"),
        count("access_codes", "state", "available"),
        count("applications", "status", "pending"),
        count("course_requests", "status", "pending"),
      ]);
      return { review, codes, applications, requests } satisfies NavCounts;
    },
  });

  const author = useQuery({
    queryKey: ["portal", "nav-counts", "author", profileId],
    enabled: !isAdmin && Boolean(profileId),
    staleTime: 30_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("author_id", profileId!)
        .in("status", ["assigned", "in_progress", "changes_requested"]);
      return { myCourses: count ?? 0 } satisfies NavCounts;
    },
  });

  return isAdmin ? (admin.data ?? {}) : (author.data ?? {});
}
