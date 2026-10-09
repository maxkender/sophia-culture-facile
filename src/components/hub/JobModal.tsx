import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Globe, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SOPHIA_APP_ID, useAdminApp } from "@/lib/apps";
import { COUNTRIES } from "@/config/countries";
import { eur } from "./hub-data";

export const POSITIONS = ["UGC creator", "Clipper", "Influencer", "Video editor", "Slideshow poster"] as const;
export const PLATFORMS = ["tiktok", "instagram", "youtube", "twitter", "facebook", "snapchat"] as const;
export const CONTENT_TYPES = ["Face-cam talking", "Screen/POV", "Reaction", "Slideshow", "Faceless"];
export const PRODUCT_TYPES = ["Mobile app", "Web app", "Physical product", "Service"];
const AGES: Record<string, [number | null, number | null]> = { "Any Age": [null, null], "18+": [18, null], "18-24": [18, 24], "25-34": [25, 34], "35+": [35, null] };

export type Goal = { metric: "posts" | "views" | "installs"; threshold: number; amount: number; period: "week" | "month" };
export type AppItem = { type: "video" | "link" | "question" | "file"; label: string; required: boolean };
export type JobDraft = {
  title: string; campaign_id: string | null; open: boolean; cover_image_path: string | null; position: string; details_md: string;
  access: "job_feed" | "invite_only" | "link"; payment_type: "per_post" | "retainer" | "cpm" | "hybrid"; base_mode: "per_post" | "retainer";
  base_amount: number; retainer_frequency: "weekly" | "monthly"; cpm_rate: number; weekly_hours: string; bonus_goals: Goal[];
  verified_country: boolean; countries: string[]; age: string; platforms: string[]; account_type: "personal" | "brand_owned";
  content_type: string; product_type: string; video_length_s: number | null; posting_frequency_n: number | null;
  posting_frequency_unit: "week" | "month"; application_items: AppItem[];
};

export const emptyJob = (): JobDraft => ({
  title: "", campaign_id: null, open: false, cover_image_path: null, position: "UGC creator", details_md: "", access: "job_feed",
  payment_type: "hybrid", base_mode: "per_post", base_amount: 1, retainer_frequency: "monthly", cpm_rate: 2, weekly_hours: "5",
  bonus_goals: [], verified_country: false, countries: [], age: "18+", platforms: ["tiktok", "instagram"], account_type: "brand_owned",
  content_type: "Face-cam talking", product_type: "Mobile app", video_length_s: 30, posting_frequency_n: 5, posting_frequency_unit: "week",
  application_items: [{ type: "video", label: "Short talking video", required: true }],
});

export function exampleEarnings(j: Pick<JobDraft, "payment_type" | "base_mode" | "base_amount" | "cpm_rate" | "retainer_frequency">) {
  const posts = 20, views = 30000;
  const usesBase = j.payment_type !== "cpm";
  const usesCpm = j.payment_type === "cpm" || j.payment_type === "hybrid";
  const parts: string[] = []; let total = 0;
  if (usesBase && (j.payment_type === "per_post" || (j.payment_type === "hybrid" && j.base_mode === "per_post"))) { parts.push(`${posts} posts × ${eur(j.base_amount)}`); total += posts * j.base_amount; }
  if (usesBase && (j.payment_type === "retainer" || (j.payment_type === "hybrid" && j.base_mode === "retainer"))) { parts.push(`${eur(j.base_amount)} ${j.retainer_frequency} retainer`); total += j.base_amount; }
  if (usesCpm) { parts.push(`${views.toLocaleString("en")} views × ${eur(j.cpm_rate)}/1000`); total += (views / 1000) * j.cpm_rate; }
  return `${parts.join(" + ")} = ${eur(total)}`;
}

export function JobPublicCard({ job, appName }: { job: Partial<JobDraft> & { title: string }; appName?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-portal">
      {job.cover_image_path ? <img src={job.cover_image_path} alt="" className="aspect-square w-full max-h-64 object-cover" /> : <div className="h-24 bg-gradient-to-r from-brand-navy to-portal-accent" />}
      <div className="space-y-3 p-5">
        <p className="text-xs font-bold uppercase text-portal-accent">{appName ?? "Sophia"} · {job.position}</p>
        <h2 className="text-2xl font-extrabold text-brand-navy">{job.title || "Untitled job"}</h2>
        <div className="flex flex-wrap gap-4">
          {job.payment_type !== "cpm" ? <div><p className="text-3xl font-extrabold text-brand-navy">{eur(job.base_amount ?? 0)}</p><p className="text-xs text-brand-navySoft">{job.base_mode === "retainer" || job.payment_type === "retainer" ? `per ${job.retainer_frequency === "weekly" ? "week" : "month"}` : "per post"}</p></div> : null}
          {job.payment_type === "cpm" || job.payment_type === "hybrid" ? <div><p className="text-3xl font-extrabold text-brand-navy">{eur(job.cpm_rate ?? 0)}</p><p className="text-xs text-brand-navySoft">per 1,000 views</p></div> : null}
        </div>
        {job.details_md ? <p className="whitespace-pre-line text-sm text-brand-navy">{job.details_md}</p> : null}
        <ul className="flex flex-wrap gap-2 text-xs">
          {(job.platforms ?? []).map((p) => <li key={p} className="rounded-full bg-portal-bg px-2.5 py-1 font-bold capitalize text-brand-navy">{p}</li>)}
          {job.content_type ? <li className="rounded-full bg-portal-bg px-2.5 py-1 font-bold text-brand-navy">{job.content_type}</li> : null}
          {job.posting_frequency_n ? <li className="rounded-full bg-portal-bg px-2.5 py-1 font-bold text-brand-navy">{job.posting_frequency_n} posts / {job.posting_frequency_unit}</li> : null}
          {job.countries?.length ? <li className="rounded-full bg-portal-bg px-2.5 py-1 font-bold text-brand-navy">{job.countries.join(", ")}</li> : null}
        </ul>
      </div>
    </div>
  );
}

const input = "mt-1 block min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";
const label = "block text-sm font-semibold text-brand-navy";

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1 rounded-xl bg-portal-bg p-1">
      {options.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={cn("min-h-9 flex-1 rounded-lg px-3 text-sm font-bold", value === v ? "bg-card text-brand-navy shadow-sm" : "text-brand-navySoft")}>{l}</button>)}
    </div>
  );
}

export function JobFields({ j, set, tab }: { j: JobDraft; set: (p: Partial<JobDraft>) => void; tab: "details" | "payment" | "content" }) {
  const { data: campaigns = [] } = useQuery({ queryKey: ["hub", "campaign-options"], queryFn: async () => (await supabase.from("campaigns").select("id, name").order("created_at", { ascending: false })).data ?? [] });
  const [aiBusy, setAiBusy] = useState(false);
  if (tab === "details") return (
    <div className="space-y-4">
      <label className={label}>Title<input className={input} value={j.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex. UGC Creator for skincare launch" /></label>
      <label className={label}>Campaign<select className={input} value={j.campaign_id ?? ""} onChange={(e) => set({ campaign_id: e.target.value || null })}><option value="">New campaign</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="flex items-start gap-3 rounded-xl border border-brand-line p-3"><input type="checkbox" className="mt-1" checked={j.open} onChange={(e) => set({ open: e.target.checked })} /><span><b className="text-sm text-brand-navy">Open</b><span className="block text-xs text-brand-navySoft">Creators sign your contract when they apply. Accepting an applicant adds them to the campaign right away.</span></span></label>
      <div className={label}>Add a cover image
        <label className="mt-1 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-line text-xs text-brand-navySoft"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) readCover(f, (u) => set({ cover_image_path: u })); }}>
          {j.cover_image_path ? <img src={j.cover_image_path} alt="" className="size-20 rounded-lg object-cover" /> : null}
          <span>Drag & drop · 300×300 recommended · PNG, JPG, SVG</span>
          <span className="font-bold text-portal-accent">Select File</span>
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) readCover(f, (u) => set({ cover_image_path: u })); }} />
        </label>
      </div>
      <label className={label}>Position<select className={input} value={j.position} onChange={(e) => set({ position: e.target.value })}>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select></label>
      <label className={label}>
        <span className="flex justify-between">Details <span className="text-xs font-normal text-brand-navySoft">{j.details_md.length}/1000</span></span>
        <textarea className={cn(input, "min-h-32 py-2")} maxLength={1000} value={j.details_md} onChange={(e) => set({ details_md: e.target.value })} placeholder="What the creator will do. **bold**, _italic_, ~~strike~~ and links are supported." />
      </label>
      <button type="button" disabled={aiBusy} className="text-sm font-bold text-portal-accent" onClick={async () => {
        setAiBusy(true);
        const c = j.campaign_id ? (await supabase.from("campaigns").select("brief_md, name").eq("id", j.campaign_id).maybeSingle()).data : null;
        const draft = `${c?.name ? `${c.name}: ` : ""}${c?.brief_md || "Short, natural videos about the app"}\n\nWhat you do: film ${j.posting_frequency_n ?? 5} ${j.content_type?.toLowerCase() ?? "short"} videos per ${j.posting_frequency_unit}, about ${j.video_length_s ?? 30}s each, on ${j.platforms.join(" and ")}.\nPay: ${exampleEarnings(j)} (example).`;
        set({ details_md: draft.slice(0, 1000) }); setAiBusy(false);
      }}>Write with AI</button>
      <label className={label}>Who has access<Seg value={j.access} onChange={(v) => set({ access: v })} options={[["job_feed", "Anyone on the job feed"], ["invite_only", "Invite only"], ["link", "Anyone with the link"]]} /></label>
    </div>
  );
  if (tab === "payment") return (
    <div className="space-y-4">
      <label className={label}>Payment Type<Seg value={j.payment_type} onChange={(v) => set({ payment_type: v })} options={[["per_post", "Per post"], ["retainer", "Retainer"], ["cpm", "CPM only"], ["hybrid", "Hybrid"]]} /></label>
      {j.payment_type === "hybrid" ? <label className={label}>Base pay<Seg value={j.base_mode} onChange={(v) => set({ base_mode: v })} options={[["per_post", "Per post"], ["retainer", "Retainer"]]} /></label> : null}
      {j.payment_type === "per_post" || (j.payment_type === "hybrid" && j.base_mode === "per_post") ? (
        <label className={label}>Rate Per Post *<input type="number" min={0} step="0.5" className={input} value={j.base_amount} onChange={(e) => set({ base_amount: Number(e.target.value) })} /></label>
      ) : null}
      {j.payment_type === "retainer" || (j.payment_type === "hybrid" && j.base_mode === "retainer") ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Base Amount *<input type="number" min={0} className={input} value={j.base_amount} onChange={(e) => set({ base_amount: Number(e.target.value) })} /></label>
          <label className={label}>Frequency *<select className={input} value={j.retainer_frequency} onChange={(e) => set({ retainer_frequency: e.target.value as "weekly" })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
        </div>
      ) : null}
      {j.payment_type === "cpm" || j.payment_type === "hybrid" ? <label className={label}>CPM Rate * <span className="font-normal text-brand-navySoft">per 1,000 views</span><input type="number" min={0} step="0.1" className={input} value={j.cpm_rate} onChange={(e) => set({ cpm_rate: Number(e.target.value) })} /></label> : null}
      <label className={label}>Weekly Commitment in Hours<select className={input} value={j.weekly_hours} onChange={(e) => set({ weekly_hours: e.target.value })}>{["2", "5", "10", "15", "20+"].map((h) => <option key={h}>{h}</option>)}</select></label>
      <div className="rounded-xl border border-brand-line p-4">
        <p className="text-sm font-bold text-brand-navy">Performance-based Bonus</p>
        {j.bonus_goals.length === 0 ? <p className="mt-1 text-xs text-brand-navySoft"><b>Set incentives and milestones</b> — Motivate your creators with performance-based bonuses</p> : null}
        {j.bonus_goals.map((g, i) => (
          <div key={i} className="mt-2 grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
            <select aria-label="Metric" className={input} value={g.metric} onChange={(e) => set({ bonus_goals: j.bonus_goals.map((x, k) => (k === i ? { ...x, metric: e.target.value as Goal["metric"] } : x)) })}><option value="posts">Posts</option><option value="views">Views</option><option value="installs">Installs</option></select>
            <input aria-label="Threshold" type="number" className={input} value={g.threshold} onChange={(e) => set({ bonus_goals: j.bonus_goals.map((x, k) => (k === i ? { ...x, threshold: Number(e.target.value) } : x)) })} />
            <input aria-label="Bonus €" type="number" className={input} value={g.amount} onChange={(e) => set({ bonus_goals: j.bonus_goals.map((x, k) => (k === i ? { ...x, amount: Number(e.target.value) } : x)) })} />
            <select aria-label="Period" className={input} value={g.period} onChange={(e) => set({ bonus_goals: j.bonus_goals.map((x, k) => (k === i ? { ...x, period: e.target.value as Goal["period"] } : x)) })}><option value="week">Week</option><option value="month">Month</option></select>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove goal" onClick={() => set({ bonus_goals: j.bonus_goals.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
          </div>
        ))}
        <button type="button" className="mt-2 text-sm font-bold text-portal-accent" onClick={() => set({ bonus_goals: [...j.bonus_goals, { metric: "posts", threshold: 10, amount: 20, period: "month" }] })}>Add Goal</button>
      </div>
      <p className="rounded-xl bg-portal-bg p-3 text-sm text-brand-navy"><b>Example earnings:</b> {exampleEarnings(j)}</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-brand-line p-3"><Globe className="mt-0.5 size-5 text-portal-accent" /><span className="flex-1"><b className="text-sm text-brand-navy">Require a verified country</b><span className="block text-xs text-brand-navySoft">Choose where creators must live to apply or accept an invitation</span></span><input type="checkbox" checked={j.verified_country} onChange={(e) => set({ verified_country: e.target.checked })} /></label>
      {j.verified_country ? (
        <label className={label}>Countries<select multiple className={cn(input, "h-32")} value={j.countries} onChange={(e) => set({ countries: [...e.target.selectedOptions].map((o) => o.value) })}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select></label>
      ) : null}
      <label className={label}>Age Range<select className={input} value={j.age} onChange={(e) => set({ age: e.target.value })}>{Object.keys(AGES).map((a) => <option key={a}>{a}</option>)}</select></label>
      <div className={label}>Platform Focus<div className="mt-1 flex flex-wrap gap-2">{PLATFORMS.map((p) => (
        <button key={p} type="button" aria-pressed={j.platforms.includes(p)} onClick={() => set({ platforms: j.platforms.includes(p) ? j.platforms.filter((x) => x !== p) : [...j.platforms, p] })} className={cn("min-h-9 rounded-full border px-3 text-sm font-bold capitalize", j.platforms.includes(p) ? "border-brand-navy bg-brand-navy text-card" : "border-brand-line text-brand-navy")}>{p}</button>
      ))}</div></div>
      <label className={label}>Account Type<Seg value={j.account_type} onChange={(v) => set({ account_type: v })} options={[["personal", "Personal"], ["brand_owned", "Brand-owned account we create"]]} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Content Type<select className={input} value={j.content_type} onChange={(e) => set({ content_type: e.target.value })}>{CONTENT_TYPES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className={label}>Product Type<select className={input} value={j.product_type} onChange={(e) => set({ product_type: e.target.value })}>{PRODUCT_TYPES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className={label}>Video Length (seconds)<input type="number" min={1} className={input} value={j.video_length_s ?? ""} onChange={(e) => set({ video_length_s: e.target.value ? Number(e.target.value) : null })} /></label>
        <div className={label}>Posting Frequency<div className="flex gap-2"><input aria-label="Posts" type="number" min={1} className={input} value={j.posting_frequency_n ?? ""} onChange={(e) => set({ posting_frequency_n: e.target.value ? Number(e.target.value) : null })} /><select aria-label="Per" className={input} value={j.posting_frequency_unit} onChange={(e) => set({ posting_frequency_unit: e.target.value as "week" })}><option value="week">per week</option><option value="month">per month</option></select></div></div>
      </div>
      <div className="rounded-xl border border-brand-line p-4">
        <p className="text-sm font-bold text-brand-navy">Application</p>
        <p className="text-xs text-brand-navySoft">What creators must provide when they apply. Required items block the application until complete.</p>
        {j.application_items.map((it, i) => (
          <div key={i} className="mt-2 grid grid-cols-[120px_1fr_auto_auto] items-center gap-2">
            <select aria-label="Type" className={input} value={it.type} onChange={(e) => set({ application_items: j.application_items.map((x, k) => (k === i ? { ...x, type: e.target.value as AppItem["type"] } : x)) })}><option value="video">Short video</option><option value="link">Link</option><option value="question">Question</option><option value="file">File</option></select>
            <input aria-label="Label" className={input} value={it.label} onChange={(e) => set({ application_items: j.application_items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={it.required} onChange={(e) => set({ application_items: j.application_items.map((x, k) => (k === i ? { ...x, required: e.target.checked } : x)) })} />Required</label>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove item" onClick={() => set({ application_items: j.application_items.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
          </div>
        ))}
        <div className="mt-2 flex flex-wrap gap-2">
          {([["video", "Short video"], ["link", "TikTok link"], ["link", "Instagram link"], ["question", "Free question"], ["file", "File"]] as const).map(([t, l]) => (
            <button key={l} type="button" className="inline-flex items-center gap-1 rounded-full border border-brand-line px-3 py-1 text-xs font-bold text-brand-navy" onClick={() => set({ application_items: [...j.application_items, { type: t, label: l, required: false }] })}><Plus className="size-3" />{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function readCover(f: File, cb: (url: string) => void) {
  if (f.size > 400_000) { toast.error("That image is too large. Please use one under 400 KB."); return; }
  const r = new FileReader(); r.onload = () => cb(String(r.result)); r.readAsDataURL(f);
}

export function jobToRow(j: JobDraft, appId: string) {
  const [age_min, age_max] = AGES[j.age] ?? [null, null];
  const { age: _age, ...rest } = j;
  return { ...rest, age_min, age_max, app_id: appId, slots: null };
}

export function JobModal({ open, onOpenChange, initial, jobId }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Partial<JobDraft>; jobId?: string }) {
  const [j, setJ] = useState<JobDraft>(() => ({ ...emptyJob(), ...initial }));
  const [tab, setTab] = useState<"details" | "payment" | "content">("details");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const { appId } = useAdminApp();
  const qc = useQueryClient();
  useEffect(() => { if (open) { setJ({ ...emptyJob(), ...initial }); setTab("details"); setPreview(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p: Partial<JobDraft>) => setJ((x) => ({ ...x, ...p }));

  async function post() {
    if (!j.title.trim()) { setTab("details"); toast.error("Give the job a title so creators know what it is."); return; }
    if (!j.platforms.length) { setTab("content"); toast.error("Pick at least one platform."); return; }
    setBusy(true);
    let campaignId = j.campaign_id;
    const app = appId ?? SOPHIA_APP_ID;
    if (!campaignId) {
      const { data, error } = await supabase.from("campaigns").insert({ app_id: app, name: j.title, type: j.position === "Influencer" ? "influencer" : "high_volume_ugc", status: "live" }).select("id").single();
      if (error) { setBusy(false); toast.error("The campaign could not be created. Please try again."); return; }
      campaignId = data.id;
    }
    const row = { ...jobToRow(j, app), campaign_id: campaignId };
    const res = jobId ? await supabase.from("jobs").update(row).eq("id", jobId) : await supabase.from("jobs").insert(row);
    setBusy(false);
    if (res.error) { toast.error("The job could not be saved. Please check the fields and try again."); return; }
    toast.success(jobId ? "Job updated" : "Job posted");
    void qc.invalidateQueries({ queryKey: ["hub"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-brand-line bg-card px-5 pt-5">
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="text-lg font-extrabold text-brand-navy">{jobId ? "Edit job posting" : "Create Job Posting"}</DialogTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setPreview((p) => !p)}><Eye className="size-4" />{preview ? "Back to editing" : "Preview as creator"}</Button>
          </div>
          {!preview ? (
            <div className="mt-3 flex gap-4 text-sm font-bold">
              {([["details", "Job Details"], ["payment", "Payment Structure"], ["content", "Content Preferences"]] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={cn("border-b-2 pb-2", tab === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l}</button>
              ))}
            </div>
          ) : <div className="h-3" />}
        </div>
        <div className="p-5">{preview ? <JobPublicCard job={j} /> : <JobFields j={j} set={set} tab={tab} />}</div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-brand-line bg-card p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy} onClick={() => void post()} className="bg-brand-navy">{busy ? "Saving…" : jobId ? "Save" : "Post Job"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
