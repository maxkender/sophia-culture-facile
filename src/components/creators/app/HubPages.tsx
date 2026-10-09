import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CheckCircle2, Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageTitle, PortalCard } from "@/components/portal/ui";
import { cn } from "@/lib/utils";
import { applyAsCreator, submitCreatorTask, taskUploadSlot } from "@/lib/hub.functions";
import { ACTIVE_POSTS, TIER_LABEL, streakDays, type Tier } from "@/lib/ugc-tiers";
import { fmtMoney } from "@/lib/ugc-pay";
import { JobPublicCard, type JobDraft } from "@/components/hub/JobModal";
import { useCreator } from "./useCreator";

const AWARD_LABEL: Record<string, string> = { first_step: "First Step", ten_posts: "10 posts", streak_7: "7-day streak", streak_30: "30-day streak", views_10k: "10K views post", views_100k: "100K views post", top10_month: "Top 10 of the month" };
const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function useHubExtras() {
  const { me } = useCreator();
  return useQuery({
    queryKey: ["creator-hub-extras", me.id],
    queryFn: async () => {
      const [awards, tasks, tiers, jobs, apps] = await Promise.all([
        supabase.from("awards").select("kind, period, awarded_at").eq("creator_id", me.id),
        supabase.from("creator_tasks").select("*").eq("creator_id", me.id).order("created_at", { ascending: false }),
        supabase.from("ugc_tiers").select("tier, label, per_post, cpm, cap_per_post, app_id"),
        supabase.from("jobs").select("*").eq("status", "active").eq("access", "job_feed").order("created_at", { ascending: false }),
        supabase.from("job_applications").select("job_id, status").eq("creator_id", me.id),
      ]);
      return { awards: awards.data ?? [], tasks: tasks.data ?? [], tiers: tiers.data ?? [], jobs: jobs.data ?? [], applications: apps.data ?? [] };
    },
  });
}

/** Stat strip, tier progress and awards — shown at the top of Home. */
export function CreatorStatsStrip() {
  const { me, posts, payoutItems } = useCreator();
  const { data } = useHubExtras();
  const approved = posts.filter((p) => p.status === "approved");
  const views = approved.reduce((s, p) => s + Number(p.views ?? 0), 0);
  const earned = payoutItems.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount ?? p.amount_usd ?? 0), 0);
  const streak = streakDays(approved.map((p) => String(p.posted_on ?? p.created_at)));
  const tier = ((me as { tier?: string }).tier ?? "trial") as Tier;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const last30 = approved.filter((p) => String(p.posted_on ?? p.created_at).slice(0, 10) >= since30).length;
  const nextPayout = payoutItems.find((p) => p.status === "accrued" || p.status === "approved");
  return (
    <div className="mb-8 space-y-4">
      <div className="grid grid-cols-4 gap-2 rounded-portal bg-card p-3 text-center shadow-portal">
        {[["Views", compact(views)], ["Earned", fmtMoney(earned)], ["Posts", String(approved.length)], ["Streak", `${streak}d`]].map(([k, v]) => (
          <div key={k}><p className="text-lg font-extrabold text-brand-navy sm:text-2xl">{v}</p><p className="text-xs text-brand-navySoft">{k}</p></div>
        ))}
      </div>
      <PortalCard className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-portal-accent/10 px-3 py-1 text-xs font-bold text-portal-accent">{TIER_LABEL[tier]} tier</span>
          {nextPayout ? <span className="text-xs text-brand-navySoft">Next payout: <b>{fmtMoney(Number(nextPayout.amount ?? 0))}</b> ({nextPayout.period})</span> : null}
        </div>
        {tier !== "pro" ? <>
          <div className="mt-3 h-2 rounded-full bg-brand-line"><div className="h-2 rounded-full bg-portal-accent" style={{ width: `${Math.min(100, (last30 / ACTIVE_POSTS) * 100)}%` }} /></div>
          <p className="mt-1 text-xs text-brand-navySoft">{tier === "trial" ? `${Math.min(last30, ACTIVE_POSTS)}/${ACTIVE_POSTS} approved posts in 30 days to reach Active` : "Stay in the top 10% of views this month to reach Pro"}</p>
        </> : <p className="mt-2 text-xs text-brand-navySoft">You're in the top tier. Keep it up!</p>}
        {data?.awards.length ? <div className="mt-3 flex flex-wrap gap-2">{data.awards.map((a) => <span key={a.kind + a.period} className="inline-flex items-center gap-1 rounded-full bg-portal-amber/15 px-2.5 py-1 text-xs font-bold text-brand-navy"><Award className="size-3" />{AWARD_LABEL[a.kind] ?? a.kind}</span>)}</div> : null}
        {streak >= 3 ? <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-portal-amber"><Flame className="size-3.5" />{streak}-day streak</p> : null}
      </PortalCard>
    </div>
  );
}

export function JobsPage() {
  const { enrolledApps } = useCreator();
  const { data, refetch } = useHubExtras();
  const apply = useServerFn(applyAsCreator);
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const jobs = (data?.jobs ?? []).filter((j) => enrolledApps.length === 0 || enrolledApps.includes(j.app_id));
  return (
    <div>
      <PageTitle title="Jobs" lead="Open jobs for your app. Open jobs start right away when you apply." />
      {jobs.length === 0 ? <PortalCard><p className="text-sm text-brand-navySoft">No open jobs right now.</p></PortalCard> : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((j) => {
            const mine = data?.applications.find((a) => a.job_id === j.id);
            const items = (j.application_items ?? []) as { type: string; label: string; required: boolean }[];
            return (
              <div key={j.id} className="space-y-2">
                <JobPublicCard job={j as unknown as JobDraft} />
                {mine ? <p className="rounded-xl bg-portal-bg p-3 text-sm font-bold text-brand-navy">Your application: {mine.status}</p>
                  : openId === j.id ? (
                    <PortalCard className="space-y-2 p-4">
                      {items.filter((i) => i.type !== "video").map((i) => <label key={i.label} className="block text-sm font-semibold">{i.label}{i.required ? " *" : ""}<input className="mt-1 block min-h-10 w-full rounded-xl border px-3" value={answers[i.label] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [i.label]: e.target.value }))} /></label>)}
                      <Button className="w-full" onClick={async () => {
                        const r = await apply({ data: { jobId: j.id, answers } });
                        if (!r.ok) { toast.error(r.reason); return; }
                        toast.success(r.accepted ? "You're in — this job is now active for you." : r.needsSignature ? "Applied. Sign the Creator Account Agreement to start." : "Applied — the team will reply soon.");
                        setOpenId(null); void refetch();
                      }}>{j.open ? "Join now" : "Send application"}</Button>
                    </PortalCard>
                  ) : <Button className="w-full" onClick={() => { setOpenId(j.id); setAnswers({}); }}>Apply</Button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskCard({ t, onDone }: { t: { id: string; type: string; title: string; instructions: string; status: string; response: string | null }; onDone: () => void }) {
  const submit = useServerFn(submitCreatorTask);
  const slot = useServerFn(taskUploadSlot);
  const [code, setCode] = useState("");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(filePath?: string) {
    setBusy(true);
    try { await submit({ data: { id: t.id, response: code || undefined, validUntil: until || undefined, filePath } }); toast.success("Thanks — sent to the team"); onDone(); }
    catch (e) { toast.error((e as Error).message || "Could not send. Please try again."); }
    finally { setBusy(false); }
  }
  async function upload(f: File) {
    const type = f.type === "video/quicktime" ? "video/quicktime" : "video/mp4";
    if (!["video/mp4", "video/quicktime"].includes(f.type)) { toast.error("Please upload an MP4 or MOV video file."); return; }
    setBusy(true);
    try {
      const s = await slot({ data: { taskId: t.id, contentType: type } });
      const { error } = await supabase.storage.from("creator-videos").uploadToSignedUrl(s.path, s.token, f, { contentType: type });
      if (error) throw new Error("The upload failed. Check your connection and try again.");
      await send(s.path);
    } catch (e) { toast.error((e as Error).message); setBusy(false); }
  }
  return (
    <PortalCard className={cn("space-y-3", t.status !== "open" && "opacity-70")}>
      <p className="flex items-center gap-2 font-extrabold text-brand-navy">{t.status === "done" ? <CheckCircle2 className="size-5 text-portal-green" /> : null}{t.title}</p>
      <p className="whitespace-pre-line text-sm text-brand-navySoft">{t.instructions}</p>
      {t.status === "open" ? (t.type === "spark_code" ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
          <input aria-label="Spark code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input aria-label="Valid until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="min-h-11 rounded-xl border px-3 text-sm" />
          <Button disabled={busy || !code.trim()} onClick={() => void send()}>Send</Button>
        </div>
      ) : (
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-brand-navy px-4 text-sm font-bold text-card">{busy ? "Uploading…" : "Upload the video"}<input type="file" accept="video/mp4,video/quicktime" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} /></label>
      )) : <p className="text-xs text-brand-navySoft">Done.</p>}
    </PortalCard>
  );
}

export function TasksPage() {
  const { data, refetch } = useHubExtras();
  const qc = useQueryClient();
  const tasks = data?.tasks ?? [];
  return (
    <div>
      <PageTitle title="Tasks" lead="Small requests from the team, like the code to boost one of your videos as an ad." />
      {tasks.length === 0 ? <PortalCard><p className="text-sm text-brand-navySoft">No tasks right now.</p></PortalCard> : (
        <div className="space-y-3">{tasks.map((t) => <TaskCard key={t.id} t={t} onDone={() => { void refetch(); void qc.invalidateQueries({ queryKey: ["creator-space"] }); }} />)}</div>
      )}
    </div>
  );
}

export function ReferralCard() {
  const { me } = useCreator();
  const handle = (me.tiktok_handle ?? me.instagram_handle ?? me.full_name.split(" ")[0] ?? "").replace(/^@/, "").toLowerCase();
  const link = typeof window !== "undefined" ? `${window.location.origin}/creators?ref=${encodeURIComponent(handle)}` : "";
  return (
    <PortalCard>
      <p className="font-extrabold text-brand-navy">Invite friends</p>
      <p className="mt-1 text-sm text-brand-navySoft">Share your link. When someone you invite joins, you earn a share of their earnings for their first 60 days.</p>
      <div className="mt-3 flex gap-2"><input readOnly aria-label="Referral link" value={link} className="min-h-10 flex-1 rounded-xl border bg-portal-bg px-3 text-sm" /><Button onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied"); }}>Copy</Button></div>
    </PortalCard>
  );
}
