import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatMessageTime, openConversation, type Conversation } from "@/lib/messaging";
import { usePortalProfile } from "./usePortal";
import { MessageThread } from "./MessageThread";
import { PageTitle, PortalCard } from "./ui";

type Row = Conversation & { courses: { id: string; title: string } | null; preview: string | null };

export function AuthorMessages({ courseId }: { courseId?: string }) {
  const queryClient = useQueryClient();
  const { data: me } = usePortalProfile();
  const profileId = me?.profile?.id ?? null;
  const [selected, setSelected] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["portal", "conversations", profileId],
    enabled: Boolean(profileId),
    refetchInterval: 30_000,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, courses(id, title)")
        .eq("profile_id", profileId!)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      const list = (data ?? []) as unknown as Row[];
      const previews = await Promise.all(
        list.map(async (row) => {
          const { data: last } = await supabase
            .from("messages")
            .select("body")
            .eq("conversation_id", row.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          return last?.body ?? null;
        }),
      );
      return list.map((row, index) => ({ ...row, preview: previews[index] ?? null }));
    },
  });

  // Make sure the general thread exists, and open the requested course thread.
  useEffect(() => {
    if (!profileId) return;
    void (async () => {
      const id = await openConversation(profileId, courseId ?? null);
      setSelected((current) => current ?? id);
      await queryClient.invalidateQueries({ queryKey: ["portal", "conversations"] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, courseId]);

  const ordered = [...rows].sort((a, b) => {
    if (!a.course_id && b.course_id) return -1;
    if (a.course_id && !b.course_id) return 1;
    return (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "");
  });
  const current = ordered.find((row) => row.id === selected) ?? null;

  return (
    <div>
      <PageTitle
        title="Messages"
        lead="Anything about a course, a deadline or the format. The editorial desk answers here, in the portal."
      />

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-2">
          {ordered.length === 0 ? (
            <PortalCard>
              <p className="text-sm text-brand-navySoft">Loading your threads…</p>
            </PortalCard>
          ) : (
            ordered.map((row) => {
              const active = row.id === selected;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelected(row.id)}
                  className={cn(
                    "w-full rounded-portal border border-brand-line bg-card p-4 text-left transition",
                    active ? "ring-2 ring-portal-accent/40" : "hover:border-portal-accent/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-brand-navy">
                      {row.courses?.title ?? "General"}
                    </p>
                    {row.author_unread > 0 ? (
                      <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[11px] font-bold text-card">
                        {row.author_unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-brand-navySoft">
                    {row.preview ?? "No message yet"}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-navySoft/80">{formatMessageTime(row.last_message_at)}</p>
                </button>
              );
            })
          )}
        </div>

        {current && profileId ? (
          <MessageThread
            conversationId={current.id}
            meProfileId={profileId}
            isAdmin={false}
            title={current.courses?.title ?? "General"}
            subtitle={current.courses ? "About this course" : "Anything not tied to one course"}
          />
        ) : (
          <PortalCard className="flex items-center justify-center py-16 text-center">
            <p className="text-sm text-brand-navySoft">
              <MessageSquare className="mx-auto mb-2 size-5" aria-hidden="true" />
              Pick a thread on the left.
            </p>
          </PortalCard>
        )}
      </div>
    </div>
  );
}
