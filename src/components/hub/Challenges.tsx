import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { pickChallengeWinner } from "@/lib/challenges.functions";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const input = "mt-1 block min-h-10 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function Challenges() {
  const { appId } = useAdminApp();
  const app = appId ?? SOPHIA_APP_ID;
  const qc = useQueryClient();
  const pick = useServerFn(pickChallengeWinner);
  const [f, setF] = useState({ title: "Meilleur hook de la semaine", description: "", reward: "50" });
  const { data } = useQuery({
    queryKey: ["hub", "challenges", app],
    queryFn: async () => {
      const [c, p] = await Promise.all([
        supabase.from("challenges").select("*").eq("app_id", app).order("starts_at", { ascending: false }),
        supabase.from("creator_posts").select("id, url, views, posted_on, created_at, creators(full_name)").eq("app_id", app).eq("status", "approved").order("views", { ascending: false, nullsFirst: false }).limit(200),
      ]);
      return { challenges: c.data ?? [], posts: p.data ?? [] };
    },
  });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "challenges"] });
  async function create() {
    if (!f.title.trim()) { toast.error("Give the challenge a title."); return; }
    const { error } = await supabase.from("challenges").insert({ app_id: app, title: f.title.trim(), description: f.description, reward_eur: Number(f.reward) || 0, status: "draft" });
    if (error) toast.error("Could not create the challenge."); else { toast.success("Challenge created as draft"); reload(); }
  }
  return (
    <div className="space-y-4">
      <div className={`${card} grid gap-3 md:grid-cols-[1fr_1fr_120px_auto] md:items-end`}>
        <label className="text-sm font-semibold">Title<input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="text-sm font-semibold">Description<input className={input} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What wins, and how it is judged" /></label>
        <label className="text-sm font-semibold">Reward (€)<input type="number" min={0} className={input} value={f.reward} onChange={(e) => setF({ ...f, reward: e.target.value })} /></label>
        <Button onClick={() => void create()}>New challenge</Button>
      </div>
      {(data?.challenges ?? []).length === 0 ? <p className={`${card} text-sm text-brand-navySoft`}>No challenges yet. Create one per week, then set it live.</p> : null}
      {(data?.challenges ?? []).map((c) => {
        const inRange = (data?.posts ?? []).filter((p) => { const d = String(p.posted_on ?? p.created_at).slice(0, 10); return d >= c.starts_at.slice(0, 10) && d <= c.ends_at.slice(0, 10); });
        return (
          <div key={c.id} className={`${card} space-y-3`}>
            <div className="flex flex-wrap items-center gap-2">
              <Trophy className="size-5 text-portal-amber" />
              <p className="font-extrabold text-brand-navy">{c.title}</p>
              <span className="rounded-full bg-portal-bg px-2 py-0.5 text-xs font-bold">{c.status}</span>
              <span className="text-xs text-brand-navySoft">{Number(c.reward_eur)} € · {new Date(c.starts_at).toLocaleDateString()} → {new Date(c.ends_at).toLocaleDateString()}</span>
              <div className="ml-auto flex gap-2">
                {c.status === "draft" ? <Button size="sm" onClick={async () => { await supabase.from("challenges").update({ status: "live" }).eq("id", c.id); reload(); }}>Set live</Button> : null}
                {c.status === "live" ? <Button size="sm" variant="outline" onClick={async () => { await supabase.from("challenges").update({ status: "closed" }).eq("id", c.id); reload(); }}>Close</Button> : null}
              </div>
            </div>
            {c.description ? <p className="text-sm text-brand-navySoft">{c.description}</p> : null}
            {c.winner_post_id ? <p className="text-sm font-bold text-portal-green">Winner picked.</p> : c.status !== "draft" ? (
              <label className="block text-sm font-semibold">Pick the winner from approved videos posted during the challenge
                <select className={input} defaultValue="" onChange={async (e) => {
                  const id = e.target.value; if (!id || !window.confirm("Pick this video as the winner? The reward is added to the creator's next payout.")) return;
                  try { await pick({ data: { challengeId: c.id, postId: id } }); toast.success("Winner picked and notified"); reload(); } catch (err) { toast.error((err as Error).message); }
                }}>
                  <option value="">{inRange.length ? "Choose a video…" : "No approved video in this period yet"}</option>
                  {inRange.map((p) => <option key={p.id} value={p.id}>{(p.creators as { full_name?: string } | null)?.full_name ?? "Creator"} · {Number(p.views ?? 0).toLocaleString()} views · {p.url}</option>)}
                </select>
              </label>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
