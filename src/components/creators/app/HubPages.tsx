import { creatorLang } from "@/i18n/creator-app";
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
import { creatorLocale, t as ct, L } from "@/i18n/creator-app";

const AWARD_LABEL: Record<string, string> = { first_step: ct("First Step"), ten_posts: "10 posts", streak_7: "7-day streak", streak_30: "30-day streak", views_10k: "10K views post", views_100k: "100K views post", top10_month: ct("Top 10 of the month"), challenge_winner: ct("Challenge winner") };
const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function useHubExtras() {
  const { me } = useCreator();
  return useQuery({
    queryKey: ["creator-hub-extras", me.id],
    queryFn: async () => {
      const [awards, tasks, tiers, jobs, apps] = await Promise.all([
        supabase.from("awards").select("kind, period, awarded_at").eq("creator_id", me.id),
        supabase.from("creator_tasks").select("*").eq("creator_id", me.id).order("created_at", { ascending: false }),
        supabase.from("ugc_tiers").select("tier, label, per_post, cpm, cap_per_post, app_id, per_post_pov, per_post_reaction, per_post_talking_head"),
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
          <div key={k}><p className="text-lg font-extrabold text-brand-navy sm:text-2xl">{v}</p><p className="text-xs text-brand-navySoft">{ct(String(k))}</p></div>
        ))}
      </div>
      <PortalCard className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span />
          {nextPayout ? <span className="text-xs text-brand-navySoft">{ct("Next payout:")} <b>{fmtMoney(Number(nextPayout.amount ?? 0))}</b> ({nextPayout.period})</span> : null}
        </div>
        <MyTerms tiers={data?.tiers ?? []} />
        {data?.awards.length ? <div className="mt-3 flex flex-wrap gap-2">{data.awards.map((a) => <span key={a.kind + a.period} className="inline-flex items-center gap-1 rounded-full bg-portal-amber/15 px-2.5 py-1 text-xs font-bold text-brand-navy"><Award className="size-3" />{AWARD_LABEL[a.kind] ?? a.kind}</span>)}</div> : null}
        {streak >= 3 ? <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-portal-amber"><Flame className="size-3.5" />{streak}-day streak</p> : null}
      </PortalCard>
      <div className="grid gap-4 md:grid-cols-2">
        <LeaderboardCard />
        <ChallengeCard />
      </div>
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
      <PageTitle title={ct("Jobs")} lead={ct("Open jobs for your app. Open jobs start right away when you apply.")} />
      {jobs.length === 0 ? <PortalCard><p className="text-sm text-brand-navySoft">{ct("No open jobs right now.")}</p></PortalCard> : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((j) => {
            const mine = data?.applications.find((a) => a.job_id === j.id);
            const items = (j.application_items ?? []) as { type: string; label: string; required: boolean }[];
            return (
              <div key={j.id} className="space-y-2">
                <JobPublicCard job={j as unknown as JobDraft} appName={(j as { app_id?: string }).app_id === "00000000-0000-4000-8000-000000000002" ? "UnSwipe" : "Sophia"} tiers={(data?.tiers ?? []).filter((t) => t.app_id === j.app_id) as never} />
                {mine ? <p className="rounded-xl bg-portal-bg p-3 text-sm font-bold text-brand-navy">Your application: {mine.status}</p>
                  : openId === j.id ? (
                    <PortalCard className="space-y-2 p-4">
                      {items.filter((i) => i.type !== "video").map((i) => <label key={ct(i.label)} className="block text-sm font-semibold">{ct(i.label)}{i.required ? " *" : ""}<input className="mt-1 block min-h-10 w-full rounded-xl border px-3" value={answers[i.label] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [i.label]: e.target.value }))} /></label>)}
                      <Button className="w-full" onClick={async () => {
                        const r = await apply({ data: { jobId: j.id, answers } });
                        if (!r.ok) { toast.error(r.reason); return; }
                        toast.success(r.accepted ? ct("You're in — this job is now active for you.") : r.needsSignature ? ct("Applied. Sign the Creator Account Agreement to start.") : ct("Applied — the team will reply soon."));
                        setOpenId(null); void refetch();
                      }}>{j.open ? ct("Join now") : ct("Send application")}</Button>
                    </PortalCard>
                  ) : <Button className="w-full" onClick={() => { setOpenId(j.id); setAnswers({}); }}>{ct("Apply")}</Button>}
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
    try { await submit({ data: { id: t.id, response: code || undefined, validUntil: until || undefined, filePath } }); toast.success(ct("Thanks — sent to the team")); onDone(); }
    catch (e) { toast.error((e as Error).message || ct("Could not send. Please try again.")); }
    finally { setBusy(false); }
  }
  async function upload(f: File) {
    const type = f.type === "video/quicktime" ? "video/quicktime" : "video/mp4";
    if (!["video/mp4", "video/quicktime"].includes(f.type)) { toast.error(ct("Please upload an MP4 or MOV video file.")); return; }
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
      <p className="flex items-center gap-2 font-extrabold text-brand-navy">{t.status === "done" ? <CheckCircle2 className="size-5 text-portal-green" /> : null}{ct(t.title)}</p>
      <p className="whitespace-pre-line text-sm text-brand-navySoft">{t.instructions}</p>
      {t.status === "open" ? (t.type === "spark_code" ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
          <input aria-label={ct("Spark code")} value={code} onChange={(e) => setCode(e.target.value)} placeholder={ct("Paste the code")} className="min-h-11 rounded-xl border px-3 text-sm" />
          <input aria-label={ct("Valid until")} type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="min-h-11 rounded-xl border px-3 text-sm" />
          <Button disabled={busy || !code.trim()} onClick={() => void send()}>{ct("Send")}</Button>
        </div>
      ) : (
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-brand-navy px-4 text-sm font-bold text-card">{busy ? "Uploading…" : ct("Upload the video")}<input type="file" accept="video/mp4,video/quicktime" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} /></label>
      )) : <p className="text-xs text-brand-navySoft">{ct("Done.")}</p>}
    </PortalCard>
  );
}

export function TasksPage() {
  const { data, refetch } = useHubExtras();
  const qc = useQueryClient();
  const tasks = data?.tasks ?? [];
  return (
    <div>
      <PageTitle title={ct("Tasks")} lead={ct("Small requests from the team, like the code to boost one of your videos as an ad.")} />
      {tasks.length === 0 ? <PortalCard><p className="text-sm text-brand-navySoft">{ct("No tasks right now.")}</p></PortalCard> : (
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
      <p className="font-extrabold text-brand-navy">{ct("Invite friends")}</p>
      <p className="mt-1 text-sm text-brand-navySoft">{ct("Share your link. When someone you invite joins, you earn a share of their earnings for their first 60 days.")}</p>
      <div className="mt-3 flex gap-2"><input readOnly aria-label={ct("Referral link")} value={link} className="min-h-10 flex-1 rounded-xl border bg-portal-bg px-3 text-sm" /><Button onClick={() => { void navigator.clipboard.writeText(link); toast.success(ct("Link copied")); }}>{ct("Copy")}</Button></div>
    </PortalCard>
  );
}

function useBoard() {
  const { me, enrolledApps } = useCreator();
  const app = enrolledApps[0] ?? "00000000-0000-4000-8000-000000000001";
  return useQuery({
    queryKey: ["creator-board", me.id, app],
    queryFn: async () => {
      const [b, c] = await Promise.all([
        supabase.rpc("leaderboard_month", { _app: app }),
        supabase.from("challenges").select("id, title, description, reward_eur, ends_at, status").eq("app_id", app).eq("status", "live").order("ends_at").limit(1),
      ]);
      return { board: (b.data ?? []) as { rank: number; creator_id: string; pseudonym: string; earnings: number; views: number; posts: number }[], challenge: c.data?.[0] ?? null };
    },
  });
}

function LeaderboardCard() {
  const { me } = useCreator();
  const { data } = useBoard();
  const board = data?.board ?? [];
  const mine = board.find((r) => r.creator_id === me.id);
  return (
    <PortalCard className="p-4">
      <div className="flex items-center justify-between"><p className="font-extrabold text-brand-navy">{ct("This month's leaderboard")}</p>{mine ? <span className="rounded-full bg-portal-accent/10 px-2.5 py-1 text-xs font-bold text-portal-accent">You're #{mine.rank}</span> : null}</div>
      {board.length === 0 ? <p className="mt-2 text-sm text-brand-navySoft">{ct("The first creators start this week. Post to take the top spot.")}</p> : (
        <ol className="mt-3 space-y-1.5">{board.slice(0, 10).map((r) => (
          <li key={r.rank} className={cn("flex items-center gap-2 rounded-lg px-2 py-1 text-sm", r.creator_id === me.id && "bg-portal-accent/10")}>
            <span className="w-6 font-extrabold text-brand-navy">{r.rank}</span><span className="flex-1 truncate">{r.pseudonym}</span>
            <span className="text-xs text-brand-navySoft">{compact(Number(r.views))} views</span><b className="w-16 text-right">{fmtMoney(Number(r.earnings))}</b>
          </li>
        ))}</ol>
      )}
      {!mine && board.length > 0 ? <p className="mt-2 text-xs text-brand-navySoft">{ct("You're not ranked yet this month — your first approved post puts you on the board.")}</p> : null}
    </PortalCard>
  );
}

function ChallengeCard() {
  const { data } = useBoard();
  const c = data?.challenge;
  return (
    <PortalCard className="p-4">
      <p className="flex items-center gap-2 font-extrabold text-brand-navy"><Award className="size-4 text-portal-amber" />{ct("Challenge of the week")}</p>
      {c ? <>
        <p className="mt-2 font-bold text-brand-navy">{ct(c.title)}{Number(c.reward_eur) > 0 ? ` — ${Number(c.reward_eur)} €` : ""}</p>
        {c.description ? <p className="mt-1 text-sm text-brand-navySoft">{ct(c.description)}</p> : null}
        <p className="mt-2 text-xs text-brand-navySoft">Ends {new Date(c.ends_at).toLocaleDateString(creatorLocale())}. Every approved video posted before then counts.</p>
      </> : <p className="mt-2 text-sm text-brand-navySoft">{ct("No challenge running right now. The next one drops soon.")}</p>}
    </PortalCard>
  );
}

/** The creator's own pay: per-creator overrides when set ("Tes conditions"), otherwise the tier. */
type TierRow = { tier: string; per_post: number | string; cpm: number | string; cap_per_post: number | string; app_id?: string | null; per_post_pov?: number | string | null; per_post_reaction?: number | string | null; per_post_talking_head?: number | string | null };

/** Per-post rate by format effort for this creator (override wins, then tier). */
export function effortRates(me: Record<string, unknown>, tiers: TierRow[], appId?: string | null) {
  const tier = String(me["tier"] ?? "trial");
  const t = tiers.find((x) => x.tier === tier && (!appId || x.app_id === appId)) ?? tiers.find((x) => x.tier === tier);
  const o = me["per_post_override"] == null ? null : Number(me["per_post_override"]);
  const pick = (k: "per_post_pov" | "per_post_reaction" | "per_post_talking_head") => o ?? (t?.[k] != null ? Number(t[k]) : t ? Number(t.per_post) : 0);
  return { pov: pick("per_post_pov"), reaction: pick("per_post_reaction"), talking_head: pick("per_post_talking_head") };
}

export function MyTerms({ tiers }: { tiers: TierRow[] }) {
  const { me } = useCreator();
  const m = me as Record<string, unknown>;
  if (!m["terms_visible"]) return null;
  const ownText = (creatorLang() === "fr" ? (m["terms_text_fr"] ?? m["terms_text_en"]) : (m["terms_text_en"] ?? m["terms_text_fr"])) as string | null;
  const tier = String(m["tier"] ?? "trial");
  const appId = (m["fast_lane_app_id"] as string | null) ?? null;
  const t = tiers.find((x) => x.tier === tier && (!appId || x.app_id === appId)) ?? tiers.find((x) => x.tier === tier);
  const num = (k: string) => (m[k] == null ? null : Number(m[k]));
  const own = ["per_post_override", "rpm_override", "cap_override", "fixed_monthly_override", "welcome_bonus"].some((k) => m[k] != null) || Boolean(m["fast_lane"]);
  const perPost = num("per_post_override") ?? (t ? Number(t.per_post) : null);
  const rpm = num("rpm_override") ?? (t ? Number(t.cpm) : null);
  const cap = num("cap_override") ?? (t ? Number(t.cap_per_post) : null);
  const fr = creatorLang() === "fr";
  if (perPost == null) return ownText ? <p className="mt-3 whitespace-pre-line text-sm text-brand-navy" data-testid="my-terms">{ownText}</p> : null;
  const eur = (n: number) => `${new Intl.NumberFormat(fr ? "fr-FR" : "en-GB", { maximumFractionDigits: 2 }).format(n)} €`;
  const target = num("posts_per_month") ?? 20;
  return (
    <div className="mt-3" data-testid="my-terms">
      <p className="text-xs font-bold uppercase tracking-wide text-portal-accent">{fr ? "Tes conditions" : "Your terms"}</p>
      {ownText ? <p className="mt-1 whitespace-pre-line text-sm text-brand-navy">{ownText}</p> : null}
      {num("fixed_monthly_override") ? <><p className="mt-1 text-sm text-brand-navy">
        <b>{eur(num("fixed_monthly_override")!)}</b> {fr ? `pour ${target} vidéos par mois` : `for ${target} videos a month`} · <b>{eur(rpm ?? 0)}</b> {fr ? "/ 1 000 vues" : "per 1,000 views"}
        {cap ? <> · {fr ? "jusqu'à" : "up to"} <b>{eur(cap)}</b> {fr ? "par post" : "per post"}</> : null}
        {perPost ? <> · + <b>{eur(perPost)}</b> {fr ? "par post" : "per post"}</> : null}
        {num("welcome_bonus") ? <> · {fr ? "bonus de bienvenue" : "welcome bonus"} <b>{eur(num("welcome_bonus")!)}</b></> : null}
      </p><p className="text-xs text-brand-navySoft">{fr ? `Au prorata si moins de ${target} vidéos.` : `Prorated if fewer than ${target} videos.`}</p></> : <p className="mt-1 text-sm text-brand-navy">
        {num("per_post_override") == null && t?.per_post_pov != null ? (() => { const r = effortRates(m, tiers, appId); return <>{ct("POV")} <b>{eur(r.pov)}</b> · {fr ? "Réaction" : "Reaction"} <b>{eur(r.reaction)}</b> {ct("· Face cam")} <b>{eur(r.talking_head)}</b> {fr ? "par post" : "per post"}</>; })() : <><b>{eur(perPost)}</b> {fr ? "par post" : "per post"}</>} · <b>{eur(rpm ?? 0)}</b> {fr ? "/ 1 000 vues" : "per 1,000 views"} · {fr ? "jusqu'à" : "up to"} <b>{eur(cap ?? 0)}</b> {fr ? "par post" : "per post"}
        {own ? <> · {fr ? "objectif" : "target"} <b>{target}</b> {fr ? "posts/mois" : "posts/month"}</> : null}
        {num("welcome_bonus") ? <> · {fr ? "bonus de bienvenue" : "welcome bonus"} <b>{eur(num("welcome_bonus")!)}</b></> : null}
      </p>}
    </div>
  );
}
