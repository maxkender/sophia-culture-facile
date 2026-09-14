import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMessageTime, type Conversation } from "@/lib/messaging";
import { usePortalProfile } from "../usePortal";
import { MessageThread } from "../MessageThread";
import { EmptyState, PageTitle, PortalCard } from "../ui";

type Row = Conversation & {
  profiles: { id: string; full_name: string; display_title: string | null } | null;
  courses: { id: string; title: string; lot_code: string | null; lot_name: string | null } | null;
  preview: string | null;
};

export function MessagesInbox({ conversationId }: { conversationId?: string | undefined }) {
  const { data: me } = usePortalProfile();
  const adminId = me?.profile?.id ?? null;
  const [selected, setSelected] = useState<string | null>(conversationId ?? null);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    if (conversationId) setSelected(conversationId);
  }, [conversationId]);

  const { data: rows = [] } = useQuery({
    queryKey: ["portal", "conversations", "admin"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, profiles(id, full_name, display_title), courses(id, title, lot_code, lot_name)")
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

  const filtered = rows.filter((row) => {
    if (unreadOnly && row.admin_unread === 0) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return `${row.profiles?.full_name ?? ""} ${row.courses?.title ?? ""}`.toLowerCase().includes(term);
  });
  const current = rows.find((row) => row.id === selected) ?? null;

  return (
    <div>
      <PageTitle title="Messages" lead="Every thread with every author, newest first. Nothing is emailed." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by author or course"
          className="h-11 max-w-xs"
        />
        <Button
          type="button"
          variant={unreadOnly ? "pill" : "pillSecondary"}
          size="pillSm"
          onClick={() => setUnreadOnly((value) => !value)}
        >
          Unread only
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState title="No thread" text="Threads appear as soon as an author writes, or when you open one." />
          ) : (
            filtered.map((row) => {
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
                    <p className="text-sm font-bold text-brand-navy">{row.profiles?.full_name ?? "Unknown author"}</p>
                    {row.admin_unread > 0 ? (
                      <span className="rounded-full bg-brand-navy px-2 py-0.5 text-[11px] font-bold text-card">
                        {row.admin_unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-brand-navySoft">
                    {row.courses?.title ?? "General"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-brand-navySoft">{row.preview ?? "No message yet"}</p>
                  <p className="mt-1 text-[11px] text-brand-navySoft/80">{formatMessageTime(row.last_message_at)}</p>
                </button>
              );
            })
          )}
        </div>

        {current && adminId ? (
          <MessageThread
            conversationId={current.id}
            meProfileId={adminId}
            isAdmin
            title={current.profiles?.full_name ?? "Author"}
            subtitle={[
              current.profiles?.display_title ?? null,
              current.courses?.lot_name ?? current.courses?.lot_code ?? null,
              current.courses?.title ?? "General thread",
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        ) : (
          <PortalCard className="flex items-center justify-center py-16">
            <p className="text-sm text-brand-navySoft">Pick a thread on the left.</p>
          </PortalCard>
        )}
      </div>
    </div>
  );
}
