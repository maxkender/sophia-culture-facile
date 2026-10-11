import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { STUDIO_DRAFT_KEY } from "@/lib/brief-studio";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { askSidekick, type Cited } from "@/lib/sidekick.functions";

type Msg = { role: "user" | "assistant"; content: string; cited?: Cited[] };
const CHIPS = ["How many French creators do we have?", "Who posted the most this week?", "What do we owe this month?", "Draft a brief about ", "Write a DM for @", "Create a fast-lane link for @"];

function briefFrom(text: string) {
  const m = text.match(/```brief\s*([\s\S]*?)```/) ?? text.match(/```json\s*([\s\S]*?)```/);
  if (!m?.[1]) return null;
  try { const b = JSON.parse(m[1]) as Record<string, unknown>; return b["title"] ? b : null; } catch { return null; }
}

export function SidekickDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const ask = useServerFn(askSidekick);
  const { appId } = useAdminApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"balanced" | "precise" | "creative">("balanced");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const { data: threads = [] } = useQuery({ queryKey: ["sidekick-threads"], enabled: open, queryFn: async () => (await supabase.from("sidekick_threads").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(20)).data ?? [] });
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function openThread(id: string) {
    const { data } = await supabase.from("sidekick_messages").select("role, content, data").eq("thread_id", id).order("created_at");
    setThreadId(id);
    setMsgs((data ?? []).map((m) => ({ role: m.role as Msg["role"], content: m.content, cited: ((m.data as { cited?: Cited[] } | null)?.cited) ?? [] })));
  }
  async function send(q = text) {
    const message = q.trim(); if (!message || busy) return;
    setMsgs((m) => [...m, { role: "user", content: message }]); setText(""); setBusy(true);
    try {
      const r = await ask({ data: { threadId, message, mode, appId: appId ?? null } });
      setThreadId(r.threadId); setMsgs((m) => [...m, { role: "assistant", content: r.answer, cited: r.cited }]);
      void qc.invalidateQueries({ queryKey: ["sidekick-threads"] });
    } catch (e) { setMsgs((m) => [...m, { role: "assistant", content: (e as Error).message }]); }
    finally { setBusy(false); }
  }
  async function saveBrief(b: Record<string, unknown>) {
    const hooks = Array.isArray(b["hooks"]) ? (b["hooks"] as string[]) : [];
    const beats = Array.isArray(b["beats"]) ? (b["beats"] as string[]) : [];
    const hookText = String(b["hook_text"] ?? hooks[0] ?? "");
    const { error } = await supabase.from("briefs").insert({ title: String(b["title"]), hooks: hooks.length ? hooks : [hookText], hook: hookText || null, hook_text: hookText || null, oral_hook: (b["oral_hook"] as string) ?? null, hook_visual: (b["hook_visual"] as string) ?? null, beats, script: beats.join("\n") || String(b["script"] ?? ""), body: [hookText, ...beats].join("\n\n") || String(b["script"] ?? ""), effort: (b["effort"] as string) ?? null, format: String(b["effort"] ?? b["format"] ?? "talking_head"), product_second: (b["product_second"] as number) ?? null, product_gesture: (b["product_gesture"] as string) ?? null, rules_do: (b["rules_do"] as string[]) ?? [], rules_dont: (b["rules_dont"] as string[]) ?? [], duration_target: String(b["duration_target"] ?? "30s"), status: "draft", app_id: appId ?? SOPHIA_APP_ID } as never);
    if (error) toast.error("Could not save the brief."); else { toast.success("Saved as a draft brief in Learn"); void qc.invalidateQueries({ queryKey: ["hub", "learn"] }); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 bg-card p-0 sm:max-w-[420px]">
        <SheetTitle className="sr-only">Assistant</SheetTitle>
        <div className="flex items-center gap-2 border-b border-brand-line p-3 pr-12">
          <Bot className="size-5 text-portal-accent" />
          <select aria-label="Mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="h-9 rounded-lg border px-2 text-sm font-bold">
            <option value="precise">Assistant · Short</option><option value="balanced">Assistant · Normal</option><option value="creative">Assistant · Detailed</option>
          </select>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setThreadId(null); setMsgs([]); }}><Plus className="size-4" />New chat</Button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-brand-navySoft">Ask about your creators, posts, payouts and briefs. Numbers come straight from your data.</p>
              <div className="flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" onClick={() => (c.endsWith(" ") || c.endsWith("@") ? setText(c) : void send(c))} className="rounded-full border border-brand-line px-3 py-1.5 text-left text-xs font-semibold text-brand-navy hover:bg-portal-bg">{c.endsWith(" ") ? c + "<topic>" : c.endsWith("@") ? c + "handle" : c}</button>)}</div>
              {threads.length ? <div><p className="mb-1 text-xs font-bold uppercase text-brand-navySoft">Recent chats</p>{threads.map((t) => <button key={t.id} type="button" onClick={() => void openThread(t.id)} className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-portal-bg">{t.title}</button>)}</div> : null}
            </div>
          ) : msgs.map((m, i) => {
            const b = m.role === "assistant" ? briefFrom(m.content) : null;
            return (
              <div key={i} className={cn("max-w-[90%] rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-brand-navy text-card" : "bg-portal-bg text-brand-navy")}>
                <p className="whitespace-pre-wrap">{m.content.replace(/```brief[\s\S]*?```/g, "").split("**").map((part, k) => (k % 2 ? <b key={k}>{part}</b> : part))}</p>
                {m.cited?.length ? <div className="mt-2 flex flex-wrap gap-1">{m.cited.map((c) => <Link key={c.name} to="/hub/ugc/creators" search={{ q: c.name }} onClick={() => onOpenChange(false)} className="rounded-full bg-card px-2 py-0.5 text-xs font-bold text-portal-accent">{c.name}</Link>)}</div> : null}
                {b ? <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => { sessionStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify({ ...b, app_id: appId ?? SOPHIA_APP_ID, beats: Array.isArray(b["beats"]) ? b["beats"] : [String(b["script"] ?? ""), "", ""] })); onOpenChange(false); void navigate({ to: "/hub/ugc/library/briefs/$briefId", params: { briefId: "new" } }); }}>Open in Studio</Button><Button size="sm" variant="outline" onClick={() => void saveBrief(b)}>Save as draft</Button></div> : null}
              </div>
            );
          })}
          {busy ? <p className="text-xs text-brand-navySoft">Assistant is thinking…</p> : null}
          <div ref={end} />
        </div>
        <form className="flex gap-2 border-t border-brand-line p-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask the Assistant…" className="min-h-11 flex-1 rounded-xl border px-3 text-sm" />
          <Button type="submit" disabled={busy || !text.trim()} aria-label="Send"><Send className="size-4" /></Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
