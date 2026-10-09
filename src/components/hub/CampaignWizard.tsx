import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp, useApps } from "@/lib/apps";
import { JobFields, JobModal, emptyJob, type JobDraft } from "./JobModal";

const STEPS = ["Campaign", "Requirements", "Payments", "Settings", "Brief", "Review", "Distribution"];
const KEY = "sophia.hub.campaignDraft";
type CType = "high_volume_ugc" | "influencer" | "paid_ads" | "analytics_only";
const RULES = ["App visible on screen", "App name said out loud", "No politics, religion or medical claims", "No reuse of a video across accounts"];

type Draft = {
  name: string; type: CType; starts_at: string; ends_at: string | null; ongoing: boolean;
  job: JobDraft; monthly_budget: number; hold_days: number; min_payout: number;
  language: string; rules: string[]; auto_reject: string; brief_md: string; brief_ids: string[];
  dist: { feed: boolean; invite: boolean; share: boolean; createJob: boolean };
};
const today = () => new Date().toISOString().slice(0, 10);
const empty = (): Draft => ({
  name: "", type: "high_volume_ugc", starts_at: today(), ends_at: null, ongoing: true, job: emptyJob(), monthly_budget: 1000, hold_days: 7, min_payout: 20,
  language: "fr", rules: [...RULES], auto_reject: "", brief_md: "", brief_ids: [], dist: { feed: true, invite: false, share: true, createJob: true },
});
const TEMPLATES: Record<string, Partial<Draft>> = {
  "Sophia UGC FR": { name: "Sophia UGC FR", type: "high_volume_ugc", language: "fr", brief_md: "Short face-cam videos in French about general knowledge, on Sophia-owned accounts that look personal." },
  "Sophia UGC EN": { name: "Sophia UGC EN", type: "high_volume_ugc", language: "en", brief_md: "Short face-cam videos in English about general knowledge, on Sophia-owned accounts that look personal." },
  "UnSwipe UGC": { name: "UnSwipe UGC", type: "high_volume_ugc", language: "en", brief_md: "Short videos about using Instagram without Reels and getting screen time back." },
};
const label = "block text-sm font-semibold text-brand-navy";
const input = "mt-1 block min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";

function TypeCard({ on, title, text, onClick, disabled }: { on?: boolean; title: string; text: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} aria-pressed={on} onClick={onClick} className={cn("rounded-2xl border-2 p-4 text-left transition", on ? "border-brand-navy bg-brand-navy/5" : "border-brand-line bg-card", disabled && "opacity-50")}>
      <p className="font-bold text-brand-navy">{title}{disabled ? <span className="ml-2 text-[10px] uppercase text-brand-navySoft">coming soon</span> : null}</p>
      <p className="mt-1 text-xs text-brand-navySoft">{text}</p>
    </button>
  );
}

export function CampaignWizard() {
  const [d, setD] = useState<Draft>(empty);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [jobFor, setJobFor] = useState<string | null>(null);
  const { appId } = useAdminApp();
  const { data: apps = [] } = useApps();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: briefs = [] } = useQuery({ queryKey: ["hub", "brief-options", appId], queryFn: async () => { let q = supabase.from("briefs").select("id, title").order("created_at", { ascending: false }).limit(100); if (appId) q = q.eq("app_id", appId); return (await q).data ?? []; } });

  useEffect(() => { try { const s = window.localStorage.getItem(KEY); if (s) setD({ ...empty(), ...JSON.parse(s) }); } catch { /* ignore */ } }, []);
  useEffect(() => { window.localStorage.setItem(KEY, JSON.stringify(d)); }, [d]);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const setJob = (p: Partial<JobDraft>) => setD((x) => ({ ...x, job: { ...x.job, ...p } }));

  function next() {
    if (step === 0 && !d.name.trim()) { toast.error("Give the campaign a name creators will understand."); return; }
    setStep((s) => Math.min(6, s + 1));
  }

  async function launch() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("campaigns").insert({
      app_id: appId ?? SOPHIA_APP_ID, name: d.name, type: d.type, starts_at: d.starts_at, ends_at: d.ongoing ? null : d.ends_at, ongoing: d.ongoing,
      status: "live", monthly_budget: d.monthly_budget, brief_md: d.brief_md, created_by: u.user?.id,
      requirements: { platforms: d.job.platforms, countries: d.job.countries, age: d.job.age, account_type: d.job.account_type, content_type: d.job.content_type, video_length_s: d.job.video_length_s, posting_frequency_n: d.job.posting_frequency_n, posting_frequency_unit: d.job.posting_frequency_unit },
      settings: { payment_type: d.job.payment_type, base_mode: d.job.base_mode, base_amount: d.job.base_amount, cpm_rate: d.job.cpm_rate, bonus_goals: d.job.bonus_goals, hold_days: d.hold_days, min_payout: d.min_payout, language: d.language, rules: d.rules, auto_reject: d.auto_reject, brief_ids: d.brief_ids },
      distribution: d.dist,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error("The campaign could not be launched. Please try again."); return; }
    toast.success("Campaign is live");
    window.localStorage.removeItem(KEY);
    void qc.invalidateQueries({ queryKey: ["hub"] });
    if (d.dist.createJob) setJobFor(data.id); else void navigate({ to: "/hub/campaigns", search: { tab: "campaigns" } });
  }

  const app = apps.find((a) => a.id === (appId ?? SOPHIA_APP_ID));

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <JobModal open={Boolean(jobFor)} onOpenChange={(o) => { if (!o) { setJobFor(null); void navigate({ to: "/hub/campaigns", search: { tab: "jobs" } }); } }}
        initial={{ ...d.job, campaign_id: jobFor, title: d.job.title || d.name, access: d.dist.feed ? "job_feed" : d.dist.share ? "link" : "invite_only" }} />
      <aside className="rounded-2xl bg-card p-4 shadow-portal">
        <ol className="flex gap-2 overflow-x-auto lg:flex-col">
          {STEPS.map((s, i) => (
            <li key={s}><button type="button" onClick={() => (i <= step || d.name ? setStep(i) : undefined)} className={cn("flex min-h-10 w-full items-center gap-2 whitespace-nowrap rounded-xl px-2 text-sm font-semibold", i === step ? "bg-brand-navy text-card" : "text-brand-navy")}>
              <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", i < step ? "bg-portal-green text-card" : "bg-portal-bg text-brand-navy")}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>{s}
            </button></li>
          ))}
        </ol>
        <button type="button" className="mt-4 hidden text-xs font-bold text-portal-red lg:block" onClick={() => { setD(empty()); setStep(0); }}>Clear draft</button>
      </aside>
      <section className="rounded-2xl bg-card p-5 shadow-portal sm:p-7">
        {step === 0 ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-extrabold text-brand-navy">Start your campaign</h2>
              <select aria-label="Use a template" className="min-h-10 rounded-xl border px-3 text-sm" value="" onChange={(e) => { const t = TEMPLATES[e.target.value]; if (t) set(t); }}><option value="">Use a template</option>{Object.keys(TEMPLATES).map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <label className={label}>Campaign name<input className={input} value={d.name} onChange={(e) => set({ name: e.target.value })} /><span className="mt-1 block text-xs font-normal text-brand-navySoft">Creators see this — make it clear and specific</span></label>
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-brand-navySoft">Organic</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TypeCard on={d.type === "high_volume_ugc"} onClick={() => set({ type: "high_volume_ugc" })} title="High-volume UGC" text="Creators post on accounts dedicated to the brand" />
                <TypeCard on={d.type === "influencer"} onClick={() => set({ type: "influencer" })} title="Influencer" text="Creators with a following post to their own audience" />
              </div>
              <p className="text-xs font-bold uppercase text-brand-navySoft">Paid</p>
              <TypeCard on={d.type === "paid_ads"} onClick={() => set({ type: "paid_ads" })} title="Paid ads" text="Creators upload videos you run as your own ads" />
              <p className="text-xs font-bold uppercase text-brand-navySoft">Other</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TypeCard on={d.type === "analytics_only"} onClick={() => set({ type: "analytics_only" })} title="Analytics only" text="Track posts without paying anyone" />
                <TypeCard disabled title="Campaign manager" text="We run the campaign for you" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>Starts<input type="date" className={input} value={d.starts_at} onChange={(e) => set({ starts_at: e.target.value })} /></label>
              <label className={label}>Ends<input type="date" className={input} disabled={d.ongoing} value={d.ongoing ? "" : d.ends_at ?? ""} onChange={(e) => set({ ends_at: e.target.value || null })} placeholder="Never" />{d.ongoing ? <span className="text-xs font-normal text-brand-navySoft">Never</span> : null}</label>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-brand-line p-3"><input type="checkbox" className="mt-1" checked={d.ongoing} onChange={(e) => set({ ongoing: e.target.checked })} /><span><b className="text-sm">Ongoing</b><span className="block text-xs text-brand-navySoft">Runs until you close it. Payouts keep going every cycle.</span></span></label>
          </div>
        ) : step === 1 ? <><h2 className="mb-4 text-xl font-extrabold text-brand-navy">Requirements</h2><JobFields j={d.job} set={setJob} tab="content" /></>
        : step === 2 ? (
          <><h2 className="mb-4 text-xl font-extrabold text-brand-navy">Payments</h2><JobFields j={d.job} set={setJob} tab="payment" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className={label}>Monthly budget cap (€)<input type="number" min={0} className={input} value={d.monthly_budget} onChange={(e) => set({ monthly_budget: Number(e.target.value) })} /></label>
              <label className={label}>Hold days<input type="number" min={0} className={input} value={d.hold_days} onChange={(e) => set({ hold_days: Number(e.target.value) })} /></label>
              <label className={label}>Minimum payout (€)<input type="number" min={0} className={input} value={d.min_payout} onChange={(e) => set({ min_payout: Number(e.target.value) })} /></label>
            </div></>
        ) : step === 3 ? (
          <div className="space-y-4"><h2 className="text-xl font-extrabold text-brand-navy">Settings</h2>
            <label className={label}>Language of content<select className={input} value={d.language} onChange={(e) => set({ language: e.target.value })}><option value="fr">French</option><option value="en">English</option></select></label>
            <fieldset className="space-y-2"><legend className="text-sm font-semibold text-brand-navy">Compliance rules</legend>{RULES.map((r) => <label key={r} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.rules.includes(r)} onChange={(e) => set({ rules: e.target.checked ? [...d.rules, r] : d.rules.filter((x) => x !== r) })} />{r}</label>)}</fieldset>
            <label className={label}>Auto-reject rules<textarea className={cn(input, "min-h-20 py-2")} value={d.auto_reject} onChange={(e) => set({ auto_reject: e.target.value })} placeholder="e.g. Videos under 10 seconds, posts on the wrong platform" /></label>
            <p className="text-xs text-brand-navySoft">Platforms and account type are set in Requirements.</p>
          </div>
        ) : step === 4 ? (
          <div className="space-y-4"><h2 className="text-xl font-extrabold text-brand-navy">Brief</h2>
            <label className={label}>Campaign brief<textarea className={cn(input, "min-h-48 py-2 font-mono")} value={d.brief_md} onChange={(e) => set({ brief_md: e.target.value })} placeholder="What creators should make, the angle, must-mentions… (markdown)" /></label>
            <div><p className="text-sm font-semibold text-brand-navy">Attach briefs from the library</p>
              {briefs.length === 0 ? <p className="text-xs text-brand-navySoft">No briefs in the library yet.</p> : <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{briefs.map((b) => <label key={b.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.brief_ids.includes(b.id)} onChange={(e) => set({ brief_ids: e.target.checked ? [...d.brief_ids, b.id] : d.brief_ids.filter((x) => x !== b.id) })} />{b.title}</label>)}</div>}
            </div>
          </div>
        ) : step === 5 ? (
          <div className="space-y-3 text-sm"><h2 className="text-xl font-extrabold text-brand-navy">Review</h2>
            {[["App", app?.name], ["Name", d.name], ["Type", d.type.replaceAll("_", " ")], ["Dates", `${d.starts_at} → ${d.ongoing ? "ongoing" : d.ends_at ?? "never"}`], ["Platforms", d.job.platforms.join(", ")], ["Countries", d.job.countries.join(", ") || "Any"], ["Pay", `${d.job.payment_type} · ${d.job.base_amount} € base · ${d.job.cpm_rate} €/1K`], ["Budget", `${d.monthly_budget} €/month · hold ${d.hold_days} days · min ${d.min_payout} €`], ["Rules", d.rules.join(" · ")], ["Briefs attached", String(d.brief_ids.length)]].map(([k, v]) => (
              <div key={k} className="flex gap-3 border-b border-brand-line pb-2"><span className="w-32 shrink-0 text-brand-navySoft">{k}</span><span className="font-semibold text-brand-navy">{v}</span></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3"><h2 className="text-xl font-extrabold text-brand-navy">Distribution</h2>
            {([["feed", "Publish to job feed", "Creators on the app's job feed can see and apply"], ["invite", "Invite-only link", "Only people you invite can join"], ["share", "Share link", "A public job page anyone with the link can open"], ["createJob", "Create a job posting from this campaign", "Opens the job form prefilled after launch"]] as const).map(([k, t, s]) => (
              <label key={k} className="flex items-start gap-3 rounded-xl border border-brand-line p-3"><input type="checkbox" className="mt-1" checked={d.dist[k]} onChange={(e) => set({ dist: { ...d.dist, [k]: e.target.checked } })} /><span><b className="text-sm">{t}</b><span className="block text-xs text-brand-navySoft">{s}</span></span></label>
            ))}
          </div>
        )}
        <div className="mt-6 flex items-center justify-between border-t border-brand-line pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < 6 ? <Button onClick={next}>Continue</Button> : <Button disabled={busy} onClick={() => void launch()} className="bg-brand-navy">{busy ? "Launching…" : "Launch campaign"}</Button>}
        </div>
      </section>
    </div>
  );
}
