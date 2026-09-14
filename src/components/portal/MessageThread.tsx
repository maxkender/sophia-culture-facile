import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatMessageTime, markConversationRead, sendMessage, type Message } from "@/lib/messaging";
import { PortalCard } from "./ui";

export function MessageThread({
  conversationId,
  meProfileId,
  isAdmin,
  title,
  subtitle,
  compact = false,
}: {
  conversationId: string;
  meProfileId: string;
  isAdmin: boolean;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["portal", "messages", conversationId],
    refetchInterval: 20_000,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    void (async () => {
      await markConversationRead(conversationId, isAdmin);
      await queryClient.invalidateQueries({ queryKey: ["portal", "conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "nav-counts"] });
    })();
  }, [conversationId, isAdmin, messages.length, queryClient]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function submit() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, meProfileId, text);
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["portal", "messages", conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "conversations"] });
    } catch {
      toast.error("The message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <PortalCard className="flex h-full flex-col p-0">
      <div className="border-b border-brand-line px-5 py-4">
        <p className="text-base font-extrabold text-brand-navy">{title}</p>
        {subtitle ? <p className="mt-0.5 text-sm text-brand-navySoft">{subtitle}</p> : null}
      </div>

      <div className={cn("flex-1 space-y-4 overflow-y-auto px-5 py-5", compact ? "max-h-72" : "max-h-[26rem]")}>
        {isLoading ? (
          <p className="text-sm text-brand-navySoft">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-brand-navySoft">No message yet. Write the first one below.</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === meProfileId;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    mine ? "bg-brand-navy text-card" : "bg-portal-bg text-brand-navy",
                  )}
                >
                  {message.body}
                  <span className={cn("mt-1 block text-[11px]", mine ? "text-card/70" : "text-brand-navySoft")}>
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      <div className="border-t border-brand-line px-5 py-4">
        <Textarea
          rows={3}
          value={body}
          placeholder="Write a message"
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submit();
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-brand-navySoft">No email is sent. The other side sees it in the portal.</p>
          <Button type="button" variant="pill" size="pillSm" disabled={!body.trim() || sending} onClick={() => void submit()}>
            <Send className="size-4" aria-hidden="true" /> Send
          </Button>
        </div>
      </div>
    </PortalCard>
  );
}
