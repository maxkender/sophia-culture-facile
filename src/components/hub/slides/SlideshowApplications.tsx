import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZONE_BADGE } from "@/lib/slideshow-guide";
import { APPLICANT_LANGS, countryCodeOf, langOfCountry, type ApplicantLang } from "@/config/countries";
import { acceptPoster, keepWarm, rejectPoster, retryOs, sendPayoutLink, tickStep } from "@/lib/slideshows.functions";
import { STATUS_LABEL, useOsStatus , OS_UI_ENABLED } from "./useOs";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const sel = "h-9 rounded-lg border border-brand-line bg-card px-2 text-sm";
type App = Database["public"]["Tables"]["slideshow_applications"]["Row"];
export const APPLICATION_TABS = [["pending", "Pending"], ["accepted", "Accepted"], ["contract_signed", "Contract signed"], ["started", "Started"], ["pool", "Pool"], ["rejected", "Rejected"], ["expired", "Expired"]] as const;
export const statusInTab = (status: string, tab: string) => tab === "contract_signed" ? ["contract_signed", "os_created"].includes(status) : tab === "accepted" ? ["accepted", "approved"].includes(status) : tab === "started" ? ["started", "dropped"].includes(status) : status === tab;

export function useSlideshowApps() {
  return useQuery({
    queryKey: ["hub", "slides", "apps"],
    queryFn: async () => {
      const [a, h, z] = await Promise.all([
        supabase.from("slideshow_applications").select("*").order("created_at", { ascending: false }).limit(2000),
        supabase.from("hiring_managers").select("profile_id, countries, tracks, active"),
        supabase.from("pay_zones").select("zone, weekly_amount, first_week_amount"),
      ]);
      const hmCountries = new Set<string>();
      for (const m of h.data ?? []) if (m.active && (m.tracks ?? []).includes("slideshow")) for (const c of m.countries ?? []) hmCountries.add(String(c).toUpperCase());
      return { apps: (a.data ?? []) as App[], hmCountries, zones: z.data ?? [] };
    },
  });
}

export function scoreOf(a: App, hmCountries: Set<string>) {
  const code = countryCodeOf(a.country);
  const checks = [
    ["Zone + hiring manager", Boolean(a.zone) && Boolean(code && hmCountries.has(code))],
    ["Adult", Boolean(a.is_adult)],
    ["Second phone", a.deux_telephones === true],
    ["Upwork", Boolean(a.has_upwork)],
    ["3 answers", Boolean(a.q_country_now && a.q_tiktok_daily && a.q_previous_content)],
  ] as const;
  return { score: checks.filter(([, ok]) => ok).length, max: checks.length, checks };
}

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

export function SlideshowApplications({ focusId }: { focusId?: string | undefined }) {
  const { data } = useSlideshowApps();
  const os = useOsStatus();
  const [f, setF] = useState({ country: "all", zone: "all", upwork: "all", phone: "all", status: focusId ? "all" : "pending" });
  const [open, setOpen] = useState<string | null>(focusId ?? null);
  const apps = data?.apps ?? [];
  const countries = useMemo(() => [...new Set(apps.map((a) => a.country))].sort(), [apps]);
  const rows = apps.filter((a) =>
    (f.country === "all" || a.country === f.country) && (f.zone === "all" || (f.zone === "none" ? !a.zone : a.zone === f.zone))
    && (f.upwork === "all" || String(Boolean(a.has_upwork)) === f.upwork) && (f.phone === "all" || String(a.deux_telephones === true) === f.phone)
    && (f.status === "all" || statusInTab(a.status, f.status)));
  const groups = useMemo(() => {
    const m = new Map<string, App[]>();
    for (const a of rows) m.set(a.country, [...(m.get(a.country) ?? []), a]);
    return [...m.entries()].sort((x, y) => y[1].length - x[1].length);
  }, [rows]);
  const counts = (list: App[]) => Object.entries(list.reduce<Record<string, number>>((m, a) => ({ ...m, [a.status]: (m[a.status] ?? 0) + 1 }), {}));

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-brand-navy">Candidatures posteurs slideshow — tu choisis qui tu acceptes, rien ne part tout seul</p>
      <div role="tablist" aria-label="Application status" className="flex flex-wrap gap-1 border-b border-brand-line pb-2">{APPLICATION_TABS.map(([key, label]) => <Button key={key} role="tab" aria-selected={f.status === key} variant={f.status === key ? "default" : "ghost"} size="sm" onClick={() => setF({ ...f, status: key })}>{label} · {apps.filter((a) => statusInTab(a.status, key)).length}</Button>)}</div>
      <div className="flex flex-wrap items-center gap-2 py-3">
        <select aria-label="Status" className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="all">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select aria-label="Country" className={sel} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="all">All countries</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Zone" className={sel} value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })}><option value="all">All zones</option><option value="A">Zone A</option><option value="B">Zone B</option><option value="C">Zone C</option><option value="none">Country not open</option></select>
        <select aria-label="Upwork" className={sel} value={f.upwork} onChange={(e) => setF({ ...f, upwork: e.target.value })}><option value="all">Upwork: any</option><option value="true">Has Upwork</option><option value="false">No Upwork</option></select>
        <select aria-label="Second phone" className={sel} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })}><option value="all">Second phone: any</option><option value="true">Has second phone</option><option value="false">No second phone</option></select>
        <span className="ml-auto text-sm text-brand-navySoft"><b className="text-brand-navy">{rows.length}</b> shown · {apps.filter((a) => a.status === "pending").length} pending</span>
      </div>
      {OS_UI_ENABLED && !os.data?.connected ? <p className="text-xs text-brand-navySoft">Active posters per country: OS not connected yet — add OS_HUB_SECRET in Settings → Secrets.</p> : null}
      {groups.map(([country, list]) => (
        <section key={country} className="overflow-hidden rounded-2xl bg-card shadow-portal" data-testid="slides-country">
          <header className="flex flex-wrap items-center gap-2 border-b border-brand-line px-4 py-3">
            <h3 className="font-extrabold text-brand-navy">{country}</h3>
            {list[0]?.zone ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", ZONE_BADGE[list[0].zone])}>Zone {list[0].zone}</span> : <span className="rounded-full bg-portal-red/10 px-2 py-0.5 text-[11px] font-bold text-portal-red">Country not open</span>}
            {counts(list).map(([s, n]) => <span key={s} className="rounded-full bg-portal-bg px-2 py-0.5 text-[11px] font-semibold">{STATUS_LABEL[s] ?? s} {n}</span>)}
            
          </header>
          <ul>{list.map((a) => { const s = scoreOf(a, data?.hmCountries ?? new Set<string>()); const isOpen = open === a.id; return (
            <li key={a.id} className="border-t border-brand-line first:border-t-0">
              <Button variant="ghost" onClick={() => setOpen(isOpen ? null : a.id)} aria-expanded={isOpen} className="h-auto min-h-14 w-full flex-wrap justify-start gap-3 rounded-none px-4 py-3 text-left text-sm hover:bg-portal-bg">
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span className="min-w-0 flex-1 font-bold text-brand-navy">{a.full_name}<span className="block break-all whitespace-normal text-xs font-normal text-brand-navySoft">{a.email} · applied {fmt(a.created_at)}</span></span>
                <span className="rounded-full bg-space-slides/10 px-2 py-0.5 text-xs font-bold text-space-slides">Score {s.score}/{s.max}</span>
                <span className="text-xs">{STATUS_LABEL[a.status] ?? a.status}</span>
              </Button>
              {isOpen ? <PosterCard a={a} score={s} zones={data?.zones ?? []} /> : null}
            </li>); })}</ul>
        </section>
      ))}
      {!groups.length ? <p className={cn(card, "text-sm text-brand-navySoft")}>No application matches.</p> : null}
    </div>
  );
}

const STEPS: [string, string, string | null][] = [
  ["accepted", "Accepted", "accepted_at"], ["contract_signed", "Contract signed", "contract_signed_at"], ["os_created", "OS account created · by hand", "os_created_at"],
  ["logins_sent", "Logins sent · by hand", null], ["slack_added", "Added to Slack · by hand", null], ["hm_notified", "Hiring manager notified", "hm_notified_at"], ["warmup", "Warm-up done", null], ["started", "Started Monday", "started_at"], ["dropped", "Dropped", "dropped_at"],
];

export function PosterCard({ a, score, zones }: { a: App; score: ReturnType<typeof scoreOf>; zones: { zone: string; weekly_amount: number | null; first_week_amount: number | null }[] }) {
  const qc = useQueryClient();
  const accept = useServerFn(acceptPoster); const reject = useServerFn(rejectPoster); const warm = useServerFn(keepWarm);
  const tick = useServerFn(tickStep); const retry = useServerFn(retryOs); const payLink = useServerFn(sendPayoutLink);
  const [mode, setMode] = useState<"none" | "accept" | "reject">("none");
  const [apps, setApps] = useState<string[]>(["sophia"]);
  const [zone, setZone] = useState<string>(a.zone ?? "");
  const [langue, setLangue] = useState<ApplicantLang>((a.langue as ApplicantLang | null) ?? langOfCountry(a.country));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "slides"] });
  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { const r = await fn() as { emailed?: boolean; ok?: boolean; error?: string }; if (r && r.ok === false) toast.error(r.error ?? "Failed"); else toast.success(r?.emailed === false ? `${ok} (email not sent — check Brevo)` : ok); setMode("none"); reload(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  const z = zones.find((x) => x.zone === zone);
  const tl = (a.timeline ?? {}) as unknown as Record<string, { at: string; by: string }>;
  const decided = !["pending", "pool"].includes(a.status);
  return (
    <div className="space-y-4 bg-portal-bg/50 px-4 pb-4 pt-2" data-testid="poster-card">
      <div className="space-y-2 text-sm">
        <p><b>Country</b> {a.country} · <b>Age 18+</b> {a.is_adult ? "OK" : "Not confirmed"}</p>
        <p><b>Phone</b> {a.phone ?? "—"} · <b>Language</b> {a.langue ? a.langue.toUpperCase() : `${langOfCountry(a.country).toUpperCase()} (country default)`} · <b>Second phone</b> {a.deux_telephones == null ? "—" : a.deux_telephones ? "yes" : "no"}</p>
        <p><b>Upwork</b> {a.has_upwork ? (a.upwork_profile_url ? <a className="text-space-slides underline" href={a.upwork_profile_url} target="_blank" rel="noreferrer">profile</a> : "yes") : "no"} · <b>Zone</b> {a.zone ?? "country not open"}</p>
        <div className="border-t border-brand-line py-3 text-xs">
          <p><b>Country now:</b> {a.q_country_now ?? "—"}</p>{a.q_hours_per_day ? <p><b>Hours/day:</b> {a.q_hours_per_day}</p> : null}<p><b>TikTok daily:</b> {a.q_tiktok_daily ?? "—"}</p><p><b>Previous content:</b> {a.q_previous_content ?? "—"}</p>
          {a.referral_source ? <p><b>Heard via:</b> {a.referral_source}</p> : null}
        </div>
        <p className="text-xs text-brand-navySoft"><b>Score {score.score}/5</b> · {score.checks.map(([l, ok]) => `${ok ? "✓" : "✗"} ${l}`).join(" · ")}</p>
        {a.start_monday ? <p><b>Start Monday</b> {fmt(a.start_monday)} · <b>Apps</b> {(a.applications ?? []).join(", ") || "—"}</p> : null}
        {a.manager_name ? <p><b>Hiring manager</b> {a.manager_name} {a.manager_email ? `· ${a.manager_email}` : ""}</p> : null}
        {a.os_email ? <p><b>OS login</b> {a.os_email}</p> : null}
        {a.rejected_reason ? <p><b>Reason</b> {a.rejected_reason}</p> : null}
      </div>
      <div className="space-y-3">
        <ul className="space-y-1 border-t border-brand-line py-3 text-sm">
          {STEPS.map(([k, l, col]) => { const at = (col && ((a as unknown as Record<string, string | null>)[col])) || tl[k]?.at; return (
            <li key={k} className="flex items-center gap-2">
              <input type="checkbox" aria-label={l} checked={Boolean(at)} disabled={busy || ["accepted", "contract_signed"].includes(k) || (["os_created", "logins_sent", "slack_added", "hm_notified", "warmup", "started"].includes(k) && !["contract_signed", "os_created", "started", "dropped"].includes(a.status))} onChange={(e) => void run(() => tick({ data: { applicationId: a.id, step: k as never, done: e.target.checked } }), "Updated")} />
              <span className="flex-1">{l}{k === "started" && a.start_monday ? ` · ${fmt(a.start_monday)}` : ""}</span><span className="text-xs text-brand-navySoft">{at ? `${fmt(at)}${tl[k]?.by ? ` · ${tl[k]?.by}` : ""}` : ""}</span>
            </li>); })}
        </ul>
        {OS_UI_ENABLED && a.os_error && a.status === "contract_signed" ? (
          <div className="rounded-xl border border-portal-red/30 bg-portal-red/5 p-3 text-sm">
            <p className="font-bold text-portal-red">OS account not created</p><p className="text-xs">{a.os_error}</p>
            <Button size="sm" className="mt-2" disabled={busy} onClick={() => void run(() => retry({ data: { applicationId: a.id } }), "OS account created")}>Retry</Button>
          </div>
        ) : null}
        {["os_created", "started"].includes(a.status) ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>{a.payout_method ? `Payout: ${a.payout_method}${a.payout_method === "stripe" && !a.stripe_onboarded ? " (setup not finished)" : ""}` : <b className="text-portal-amber">Payout method missing</b>}</span>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => payLink({ data: { applicationId: a.id } }), "Payout link emailed")}>{a.payout_token ? "Resend payout link" : "Send payout link"}</Button>
          </div>
        ) : null}
        {!decided ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setMode(mode === "accept" ? "none" : "accept")}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => setMode(mode === "reject" ? "none" : "reject")}>Reject</Button>
            {a.status === "pending" ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => warm({ data: { applicationId: a.id } }), "Kept warm (no email)")}>Keep warm</Button> : null}
          </div>
        ) : null}
        {mode === "accept" ? (
          <div className="space-y-2 border-t border-brand-line py-3 text-sm">
            <p className="font-bold">App(s) this poster will promote</p>
            {["sophia", "unswipe"].map((x) => <label key={x} className="mr-4 inline-flex items-center gap-1"><input type="checkbox" checked={apps.includes(x)} onChange={(e) => setApps(e.target.checked ? [...apps, x] : apps.filter((y) => y !== x))} />{x === "sophia" ? "Sophia" : "UnSwipe"}</label>)}
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Zone" className={sel} value={zone} onChange={(e) => setZone(e.target.value)}><option value="">Pick a zone</option>{["A", "B", "C"].map((x) => <option key={x} value={x}>Zone {x}</option>)}</select>
              <select aria-label="Email language" className={sel} value={langue} onChange={(e) => setLangue(e.target.value as ApplicantLang)}>{APPLICANT_LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
              {z ? <span className="text-xs">${Number(z.weekly_amount)}/week · first week ${Number(z.first_week_amount)}</span> : null}
            </div>
            {!a.zone ? <p className="text-xs text-portal-amber">This country is not open: picking a zone sets it by hand.</p> : null}
            <p className="text-xs text-brand-navySoft">Only Confirm acceptance sends the contract email. After signing, account creation, logins, Slack and the start are handled by hand.</p>
            <Button size="sm" disabled={busy || !zone || !apps.length} onClick={() => void run(() => accept({ data: { applicationId: a.id, apps: apps as ("sophia" | "unswipe")[], zone: zone as "A", langue } }), "Accepted, email sent")}>Confirm acceptance</Button>
          </div>
        ) : null}
        {mode === "reject" ? (
          <div className="space-y-2 border-t border-brand-line py-3 text-sm">
            <textarea aria-label="Reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (sent to the applicant in their language)" className="w-full rounded-lg border p-2" />
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => void run(() => reject({ data: { applicationId: a.id, reason } }), "Rejected, email sent")}>Reject and email</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
