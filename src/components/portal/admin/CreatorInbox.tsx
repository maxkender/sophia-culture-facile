import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageTitle, PortalCard } from "../ui";

export function CreatorInbox() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [track, setTrack] = useState("");

  const { data } = useQuery({
    queryKey: ["portal", "admin", "creator-inbox"],
    queryFn: async () => {
      const [creators, messages, anns] = await Promise.all([
        supabase.from("creators").select("id, full_name, track").order("full_name"),
        supabase.from("creator_messages").select("*").order("created_at"),
        supabase.from("creator_announcements").select("*").order("created_at", { ascending: false }),
      ]);
      return { creators: creators.data ?? [], messages: messages.data ?? [], anns: anns.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["portal", "admin", "creator-inbox"] });
  const creators = data?.creators ?? [];
  const messages = data?.messages ?? [];
  const thread = messages.filter((m) => m.creator_id === selected);
  const unread = (id: string) => messages.filter((m) => m.creator_id === id && !m.from_admin && !m.read_at).length;

  async function open(id: string) {
    setSelected(id);
    await supabase.from("creator_messages").update({ read_at: new Date().toISOString() }).eq("creator_id", id).eq("from_admin", false).is("read_at", null);
    refresh();
  }
  async function send() {
    if (!selected || !reply.trim()) return;
    const { error } = await supabase.from("creator_messages").insert({ creator_id: selected, from_admin: true, body: reply.trim() });
    if (error) return void toast.error("Could not send.");
    setReply("");
    refresh();
  }
  async function announce() {
    if (!title.trim() || !body.trim()) return void toast.error("Title and text required.");
    const { error } = await supabase.from("creator_announcements").insert({ title: title.trim(), body: body.trim(), track: track || null });
    if (error) return void toast.error("Could not publish.");
    setTitle(""); setBody(""); toast.success("Announcement published."); refresh();
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("creator_announcements").update({ active }).eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Creator messages" lead="Private threads with creators and announcements to all creators." />
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <PortalCard className="divide-y p-0">
          {creators.length === 0 && <EmptyState title="No creators" text="Add creators from the ops page." />}
          {creators.map((c) => (
            <button key={c.id} onClick={() => open(c.id)} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${selected === c.id ? "bg-muted" : ""}`}>
              <span>{c.full_name}</span>
              {unread(c.id) > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{unread(c.id)}</span>}
            </button>
          ))}
        </PortalCard>
        <PortalCard className="space-y-3 p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Pick a creator.</p>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {thread.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
                {thread.map((m) => (
                  <div key={m.id} className={`rounded-lg p-2 text-sm ${m.from_admin ? "ml-8 bg-primary/10" : "mr-8 bg-muted"}`}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(m.created_at)}</p>
                  </div>
                ))}
              </div>
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" />
              <Button onClick={send}>Send</Button>
            </>
          )}
        </PortalCard>
      </div>

      <h2 className="text-lg font-bold">Announcements</h2>
      <PortalCard className="space-y-2 p-4">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Text" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex gap-2">
          <select className="rounded-md border border-input bg-background px-3 text-sm" value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="">All creators</option>
            <option value="ugc">UGC only</option>
            <option value="slideshow">Slideshow only</option>
          </select>
          <Button onClick={announce}>Publish</Button>
        </div>
      </PortalCard>
      {(data?.anns ?? []).map((a) => (
        <PortalCard key={a.id} className="flex items-start justify-between gap-2 p-4 text-sm">
          <div>
            <p className="font-semibold">{a.title} <span className="text-xs text-muted-foreground">· {a.track ?? "all"} · {a.active ? "live" : "hidden"}</span></p>
            <p className="whitespace-pre-wrap text-muted-foreground">{a.body}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => toggle(a.id, !a.active)}>{a.active ? "Hide" : "Show"}</Button>
        </PortalCard>
      ))}
    </div>
  );
}
