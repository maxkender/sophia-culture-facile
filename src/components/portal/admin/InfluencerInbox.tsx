import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmptyState, PageTitle, PortalCard } from "../ui";

export function InfluencerInbox() {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const { data: people = [] } = useQuery({
    queryKey: ["admin", "influencers", "inbox"],
    queryFn: async () => {
      const [{ data: inf }, { data: msgs }] = await Promise.all([
        supabase.from("influencers").select("id, display_name, email, user_id").order("display_name"),
        supabase.from("influencer_messages").select("influencer_id, from_admin, read_at, created_at").order("created_at", { ascending: false }),
      ]);
      return (inf ?? []).map((i) => {
        const mine = (msgs ?? []).filter((m) => m.influencer_id === i.id);
        return { ...i, last: mine[0]?.created_at ?? null, unread: mine.filter((m) => !m.from_admin && !m.read_at).length };
      }).sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));
    },
  });
  const { data: thread = [] } = useQuery({
    queryKey: ["admin", "influencer-thread", sel],
    enabled: Boolean(sel),
    queryFn: async () => {
      const { data } = await supabase.from("influencer_messages").select("*").eq("influencer_id", sel!).order("created_at");
      await supabase.from("influencer_messages").update({ read_at: new Date().toISOString() }).eq("influencer_id", sel!).eq("from_admin", false).is("read_at", null);
      return data ?? [];
    },
  });
  async function send() {
    if (!sel || !text.trim()) return;
    const { error } = await supabase.from("influencer_messages").insert({ influencer_id: sel, body: text.trim(), from_admin: true });
    if (error) return void toast.error("The message could not be sent.");
    setText("");
    await qc.invalidateQueries({ queryKey: ["admin", "influencer-thread", sel] });
    await qc.invalidateQueries({ queryKey: ["admin", "influencers", "inbox"] });
  }
  return (
    <div>
      <PageTitle title="Influencer messages" lead="Threads with influencers on the roster. Separate from author and creator messages." />
      {!people.length ? <EmptyState title="No influencers yet" text="Accepted influencers appear here." /> : (
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <PortalCard className="p-2">
            {people.map((p) => (
              <button key={p.id} onClick={() => setSel(p.id)} className={cn("flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm", sel === p.id ? "bg-brand-navy text-card" : "hover:bg-brand-navy/5")}>
                <span className="flex-1 truncate font-semibold">{p.display_name}{!p.user_id ? " (not joined)" : ""}</span>
                {p.unread ? <span className="rounded-full bg-portal-amber px-2 text-[11px] font-bold text-card">{p.unread}</span> : null}
              </button>
            ))}
          </PortalCard>
          <PortalCard className="space-y-3">
            {!sel ? <p className="text-sm text-brand-navySoft">Pick an influencer.</p> : (
              <>
                {thread.length ? thread.map((m) => (
                  <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.from_admin ? "ml-auto bg-brand-navy text-card" : "bg-brand-navy/5 text-brand-navy")}>
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className="mt-1 text-[11px] opacity-70">{new Date(m.created_at).toLocaleString("en-GB")}</p>
                  </div>
                )) : <p className="text-sm text-brand-navySoft">No messages yet.</p>}
                <Textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" />
                <Button variant="pill" size="pillSm" onClick={send}>Send</Button>
              </>
            )}
          </PortalCard>
        </div>
      )}
    </div>
  );
}
