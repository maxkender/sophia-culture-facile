import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NotificationRow = {
  id: string;
  profile_id: string;
  type: string;
  course_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
};

export const NOTIFICATION_LABEL: Record<string, string> = {
  changes_requested: "Changes requested",
  course_accepted: "Course accepted",
  course_published: "Course published",
  course_assigned: "New course assigned",
  due_date_changed: "Due date changed",
  message: "New message",
  request_approved: "Request approved",
  request_declined: "Request declined",
  proposal_approved: "Proposal approved",
  proposal_declined: "Proposal declined",
};

export function useNotifications(profileId: string | null | undefined) {
  return useQuery({
    queryKey: ["portal", "notifications", profileId],
    enabled: Boolean(profileId),
    staleTime: 20_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useMarkNotifications(profileId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[] | "all") => {
      const now = new Date().toISOString();
      let query = supabase.from("notifications").update({ read_at: now }).is("read_at", null);
      query = ids === "all" ? query.eq("profile_id", profileId!) : query.in("id", ids);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal", "notifications"] });
    },
  });
}
