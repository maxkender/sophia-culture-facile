import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t as ct } from "@/i18n/creator-app";

export function CreatorMessages({ creatorId }: { creatorId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [hidden, setHidden] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("creator-ann-hidden") ?? "[]"); } catch { return []; }
  });
  const { data } = useQuery({
    queryKey: ["creator-messages", creatorId],
    queryFn: async () => {
      const [m, a] = await Promise.all([
        supabase.from("creator_messages").select("*").eq("creator_id", creatorId).order("created_at"),
        supabase.from("creator_announcements").select("*").order("created_at", { ascending: false }),
      ]);
      return { messages: m.data ?? [], anns: a.data ?? [] };
    },
  });
  async function send() {
    if (!text.trim()) return;
    const { error } = await supabase.from("creator_messages").insert({ creator_id: creatorId, from_admin: false, body: text.trim() });
    if (error) return void toast.error(ct("Could not send."));
    setText("");
    qc.invalidateQueries({ queryKey: ["creator-messages", creatorId] });
  }
  function dismiss(id: string) {
    const next = [...hidden, id];
    setHidden(next);
    localStorage.setItem("creator-ann-hidden", JSON.stringify(next));
  }
  const anns = (data?.anns ?? []).filter((a) => !hidden.includes(a.id));

  return (
    <>
      {anns.map((a) => (
        <section key={a.id} className="rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-brand-navy">{a.title}</p>
            <button className="text-xs text-muted-foreground" onClick={() => dismiss(a.id)}>{ct("Dismiss")}</button>
          </div>
          <p className="mt-1 whitespace-pre-wrap">{a.body}</p>
        </section>
      ))}
      <section className="space-y-2">
        <h2 className="font-bold text-brand-navy">{ct("Messages")}</h2>
        <div className="space-y-2 rounded-2xl border border-brand-line p-4">
          {(data?.messages ?? []).length === 0 && <p className="text-sm text-muted-foreground">{ct("No messages yet. Write to the Sophia team here.")}</p>}
          {(data?.messages ?? []).map((m) => (
            <div key={m.id} className={`rounded-lg p-2 text-sm ${m.from_admin ? "mr-8 bg-muted" : "ml-8 bg-primary/10"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={ct("Write a message…")} />
          <Button size="sm" onClick={send}>{ct("Send")}</Button>
        </div>
      </section>
    </>
  );
}
