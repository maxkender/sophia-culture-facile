import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Country, DetailSheet, shortDate, StatusPill } from "./Crm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZONE_BADGE } from "@/lib/slideshow-guide";
import { APPLICANT_LANGS, countryCodeOf, langOfCountry, type ApplicantLang } from "@/config/countries";
import { osIdentities, acceptPoster, acceptPostersBulk, keepWarm, markRuulAdded, osZones, rejectPoster, retryOs, saveRuulEmail, tickStep } from "@/lib/slideshows.functions";
import { RUUL_BLOCKED } from "@/lib/ruul";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STATUS_LABEL, useOsStatus , OS_UI_ENABLED } from "./useOs";

const card = "rounded-2xl bg-card p-5 shadow-portal";
const sel = "h-9 rounded-lg border border-brand-line bg-card px-2 text-sm";
type App = Database["public"]["Tables"]["slideshow_applications"]["Row"];
export const APPLICATION_TABS = [["pending", "Pending"], ["accepted", "Accepted"], ["contract_signed", "Signed"], ["os_created", "In OS"], ["started", "Started"], ["rejected", "Refused"], ["all", "All"]] as const;
export const statusInTab = (status: string, tab: string) => tab === "all" ? true : tab === "contract_signed" ? status === "contract_signed" : tab === "accepted" ? ["accepted", "approved"].includes(status) : tab === "started" ? ["started", "dropped"].includes(status) : status === tab;

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
  const answered = [a.q_country_now, a.q_tiktok_daily, a.q_previous_content].filter((v) => v && String(v).trim()).length;
  const checks = [
    ["Zone + hiring manager", Boolean(a.zone) && Boolean(code && hmCountries.has(code))],
    ["Adult", Boolean(a.is_adult)],
    ["Upwork", Boolean(a.has_upwork)],
    // Screening answers are optional: never a penalty, shown as information only.
    [`${answered}/3 answers`, true],
  ] as const;
  return { score: checks.filter(([, ok]) => ok).length, max: checks.length, checks };
}

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

/** Posters created in the OS and not yet added in Ruul: they need the legal name from the OS. */
export const needsLegalName = (a: App) => ["os_created", "started"].includes(a.status) && Boolean(a.os_email || (a as Record<string, unknown>)["os_created_at"]) && !(a as Record<string, unknown>)["ruul_added_at"];

export function useLegalNames(apps: App[]) {
  const fn = useServerFn(osIdentities);
  const ids = apps.filter(needsLegalName).map((a) => a.id).sort();
  return useQuery({
    queryKey: ["hub", "slides", "identites", ids.join(",")],
    queryFn: async () => new Map((await fn({ data: { hubIds: ids } })).rows.map((r) => [r.hub_id, r] as const)),
    enabled: ids.length > 0, staleTime: 60_000, retry: false,
  });
}

export function SlideshowApplications({ focusId }: { focusId?: string | undefined }) {
  const { data } = useSlideshowApps();
  const qc = useQueryClient();
  const reject = useServerFn(rejectPoster);
  const [country, setCountry] = useState("all");
  const [status, setStatus] = useState(focusId ? "all" : "pending");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(focusId ?? null);
  const [mode, setMode] = useState<"none" | "accept" | "reject">("none");
  const [checked, setChecked] = useState<string[]>([]);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const apps = data?.apps ?? [];
  const { data: legal } = useLegalNames(apps);
  const { data: zones } = useQuery({ queryKey: ["hub", "os-zones"], queryFn: () => osZones(), staleTime: 600000, retry: false });
  const countries = useMemo(() => [...new Set(apps.map((a) => a.country))].sort(), [apps]);
  const rows = apps.filter((a) => (country === "all" || a.country === country) && statusInTab(a.status, status) && `${a.full_name} ${a.email} ${a.country}`.toLowerCase().includes(search.toLowerCase()));
  const selected = apps.filter((a) => checked.includes(a.id));
  const active = apps.find((a) => a.id === open);
  const isClosed = (a: App) => Boolean(zones?.ok && countryCodeOf(a.country) && !zones.ouverts.some((z) => z.pays_code === countryCodeOf(a.country)));
  const show = (a: App, action: "none" | "accept" | "reject" = "none") => { setOpen(a.id); setMode(action); };
  async function refuseSelected() {
    setBusy(true); let refused = 0; let skipped = 0; let failed = 0;
    for (const a of selected) {
      if (!["pending", "pool"].includes(a.status)) { skipped++; continue; }
      try { await reject({ data: { applicationId: a.id, reason } }); refused++; } catch { failed++; }
    }
    setSummary(`${refused} refused · ${skipped} skipped · ${failed} failed`); setBusy(false);
    void qc.invalidateQueries({ queryKey: ["hub", "slides"] }); setChecked([]);
  }
  return <div className="space-y-3">
    <p className="crm-count">{rows.length} applications · {apps.filter((a) => a.status === "pending").length} pending</p>
    <div className="crm-toolbar">
      <input aria-label="Search applications" placeholder="Search name or email" className="crm-search" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select aria-label="Country" className={sel} value={country} onChange={(e) => setCountry(e.target.value)}><option value="all">All countries</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
      <div className="ml-auto">{country !== "all" ? <AcceptAllButton country={country} pending={apps.filter((a) => a.country === country && a.status === "pending")} /> : null}</div>
    </div>
    <div role="tablist" aria-label="Application status" className="flex flex-wrap gap-1">{APPLICATION_TABS.map(([key,label]) => <Button key={key} size="sm" variant={status === key ? "secondary" : "ghost"} role="tab" aria-selected={status === key} onClick={() => setStatus(key)}>{label} <span className="text-brand-navySoft">{apps.filter((a) => statusInTab(a.status,key)).length}</span></Button>)}</div>
    {selected.length ? <div className="crm-toolbar border-y border-brand-line py-2"><span className="text-sm">{selected.length} selected</span><AcceptAllButton country="selected applications" pending={selected} label="Accept" selection /><Button size="sm" variant="outline" onClick={() => { setSummary(""); setRefuseOpen(true); }}>Refuse</Button><Button size="sm" variant="ghost" onClick={() => setChecked([])}>Clear</Button></div> : null}
    <div className="crm-table"><table className="min-w-[920px] text-left" data-testid="slides-applications-table"><thead className="text-xs text-brand-navySoft"><tr><th><input type="checkbox" aria-label="Select all shown" checked={rows.length > 0 && rows.every((a) => checked.includes(a.id))} onChange={(e) => setChecked(e.target.checked ? rows.map((a) => a.id) : [])} /></th><th>Name</th><th>Country</th><th>Zone</th><th>Status</th><th>Applied</th><th>Start Monday</th><th>Actions</th></tr></thead><tbody>{rows.map((a) => <tr key={a.id} className="cursor-pointer border-t border-brand-line" onClick={() => show(a)}><td onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${a.full_name}`} checked={checked.includes(a.id)} onChange={(e) => setChecked(e.target.checked ? [...checked,a.id] : checked.filter((id) => id !== a.id))} /></td><td><Button variant="link" className="h-auto p-0 text-sm font-medium text-brand-navy" onClick={() => show(a)}>{a.full_name}</Button></td><td><Country country={a.country} />{isClosed(a) ? <span className="ml-2 rounded bg-portal-bg px-1.5 py-0.5 text-[10px] text-brand-navySoft">Closed in OS</span> : null}</td><td>{a.zone ?? "—"}</td><td><StatusPill status={a.status} /></td><td className="whitespace-nowrap">{shortDate(a.created_at)}</td><td className="whitespace-nowrap">{shortDate(a.start_monday)}</td><td onClick={(e) => e.stopPropagation()}>{["pending","pool"].includes(a.status) ? <div className="flex gap-1"><Button size="sm" variant="ghost" disabled={isClosed(a) || Boolean(countryCodeOf(a.country) && RUUL_BLOCKED.includes(countryCodeOf(a.country) ?? ""))} onClick={() => show(a,"accept")}>Accept</Button><Button size="sm" variant="ghost" onClick={() => show(a,"reject")}>Refuse</Button></div> : null}</td></tr>)}</tbody></table>{!rows.length ? <p className="p-4 text-sm text-brand-navySoft">No applications.</p> : null}</div>
    <DetailSheet open={Boolean(active)} onClose={() => setOpen(null)} title={active?.full_name ?? "Application"} description={active?.email ?? ""}>{active ? <PosterCard key={`${active.id}-${mode}`} a={active} initialMode={mode} score={scoreOf(active,data?.hmCountries ?? new Set())} zones={data?.zones ?? []} legal={needsLegalName(active) ? legal?.get(active.id) ?? null : undefined} /> : null}</DetailSheet>
    <Dialog open={refuseOpen} onOpenChange={(v) => { if (!busy) setRefuseOpen(v); }}><DialogContent><DialogHeader><DialogTitle>Refuse {selected.length} applications?</DialogTitle><DialogDescription>{selected.map((a) => a.full_name).join(", ")}</DialogDescription></DialogHeader>{summary ? <p className="text-sm">{summary}</p> : <textarea aria-label="Refusal reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-full rounded-lg border p-2" />}<DialogFooter><Button variant="ghost" disabled={busy} onClick={() => setRefuseOpen(false)}>Close</Button>{!summary ? <Button variant="destructive" disabled={busy} onClick={() => void refuseSelected()}>Confirm refusal</Button> : null}</DialogFooter></DialogContent></Dialog>
  </div>;
}

const STEPS: [string, string, string | null][] = [
  ["accepted", "Accepted", "accepted_at"], ["contract_signed", "Contract signed", "contract_signed_at"], ["os_created", "OS account created", "os_created_at"],
  ["logins_sent", "Logins sent", null], ["slack_added", "Added to Slack · by hand", null], ["hm_notified", "Hiring manager notified", "hm_notified_at"], ["warmup", "Warm-up done", null], ["started", "Started Monday", "started_at"], ["dropped", "Dropped", "dropped_at"],
];

export function PosterCard({ a, score, zones, legal, initialMode = "none" }: { initialMode?: "none" | "accept" | "reject"; a: App; legal?: { prenom_legal: string; nom_legal: string } | null | undefined; score: ReturnType<typeof scoreOf>; zones: { zone: string; weekly_amount: number | null; first_week_amount: number | null }[] }) {
  const qc = useQueryClient();
  const accept = useServerFn(acceptPoster); const reject = useServerFn(rejectPoster); const warm = useServerFn(keepWarm);
  const tick = useServerFn(tickStep); const retry = useServerFn(retryOs);
  const saveRuul = useServerFn(saveRuulEmail); const ruulAdded = useServerFn(markRuulAdded);
  const { data: osZoneData } = useQuery({ queryKey: ["hub", "os-zones"], queryFn: () => osZones(), staleTime: 10 * 60_000, retry: false });
  const [mode, setMode] = useState<"none" | "accept" | "reject">(initialMode);
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
  // Accept gates: the OS zone must be open, and Ruul must be able to pay the country.
  const iso = countryCodeOf(a.country);

  const closedZone = osZoneData?.ok && iso ? osZoneData.fermes.find((f) => f.pays_code === iso) : undefined;
  const zoneBlocked = Boolean(osZoneData?.ok && iso && !osZoneData.ouverts.some((o) => o.pays_code === iso));
  const ruulBlocked = Boolean(iso && RUUL_BLOCKED.includes(iso));
  const acceptBlock = ruulBlocked ? "Country not supported by Ruul" : zoneBlocked ? (closedZone?.raison ? `Closed in OS — ${closedZone.raison}` : "Closed in OS") : null;
  return (
    <div className="space-y-4 pb-4" data-testid="poster-card">
      <div className="space-y-2 text-sm">
        <p><b>Country</b> {a.country} · <b>Age 18+</b> {a.is_adult ? "OK" : "Not confirmed"}</p>
        <p>{a.phone ? <><b>Phone</b> {a.phone} · </> : null}<b>Language</b> {a.langue ? a.langue.toUpperCase() : `${langOfCountry(a.country).toUpperCase()} (country default)`}</p>
        <p>{a.has_upwork == null ? null : <><b>Upwork</b> {a.has_upwork ? (a.upwork_profile_url ? <a className="text-space-slides underline" href={a.upwork_profile_url} target="_blank" rel="noreferrer">profile</a> : "yes") : "no"} · </>}<b>Zone</b> {a.zone ?? "country not open"}</p>
        <div className="border-t border-brand-line py-3 text-xs">
          {a.q_country_now ? <p><b>Country now:</b> {a.q_country_now}</p> : null}{a.q_hours_per_day ? <p><b>Hours/day:</b> {a.q_hours_per_day}</p> : null}{a.q_tiktok_daily ? <p><b>TikTok daily:</b> {a.q_tiktok_daily}</p> : null}{a.q_previous_content ? <p><b>Previous content:</b> {a.q_previous_content}</p> : null}
          {a.referral_source ? <p><b>Heard via:</b> {a.referral_source}</p> : null}
        </div>
        {a.start_monday ? <p><b>Start Monday</b> {fmt(a.start_monday)} · <b>Apps</b> {(a.applications ?? []).join(", ") || "—"}</p> : null}
        {a.manager_name ? <p><b>Cohort</b> {a.manager_name}</p> : null}
        {a.os_email ? <p><b>OS login</b> {a.os_email}{(a as Record<string, unknown>)["os_langue"] ? ` · posting language ${String((a as Record<string, unknown>)["os_langue"]).toUpperCase()}` : ""}</p> : null}
        {a.rejected_reason ? <p><b>Reason</b> {a.rejected_reason}</p> : null}
        <p className="text-xs text-brand-navySoft"><b>Paid via</b> Ruul · {(a as Record<string, unknown>)["ruul_added_at"] ? "added" : "to add"}</p>
      </div>
      <div className="space-y-3">
        <ul className="space-y-1 border-t border-brand-line py-3 text-sm">
          {STEPS.map(([k, l, col]) => { const at = (col && ((a as unknown as Record<string, string | null>)[col])) || tl[k]?.at; return (
            <li key={k} className="flex items-center gap-2">
              <input type="checkbox" aria-label={l} checked={Boolean(at)} disabled={busy || ["accepted", "contract_signed", "logins_sent", "hm_notified"].includes(k) || (["os_created", "slack_added", "warmup", "started"].includes(k) && !["contract_signed", "os_created", "started", "dropped"].includes(a.status))} onChange={(e) => void run(() => tick({ data: { applicationId: a.id, step: k as never, done: e.target.checked } }), "Updated")} />
              <span className="flex-1">{l}{k === "started" && a.start_monday ? ` · ${fmt(a.start_monday)}` : ""}</span><span className="text-xs text-brand-navySoft">{at ? `${fmt(at)}${tl[k]?.by ? ` · ${tl[k]?.by}` : ""}` : ""}</span>
            </li>); })}
        </ul>
        {OS_UI_ENABLED && a.os_error && a.status === "contract_signed" ? (
          <div className="rounded-xl border border-portal-red/30 bg-portal-red/5 p-3 text-sm">
            <p className="font-bold text-portal-red">OS account not created</p><p className="text-xs">{a.os_error}</p>
            <Button size="sm" className="mt-2" disabled={busy} onClick={() => void run(() => retry({ data: { applicationId: a.id } }), "OS account created")}>Retry</Button>
          </div>
        ) : null}
        {["contract_signed", "os_created", "started"].includes(a.status) ? (
          <div className="space-y-2 rounded-xl border border-brand-line bg-card p-3 text-sm" data-testid="ruul-box">
            <p className="font-bold text-brand-navy">Add to Ruul <span className="ml-1 rounded-full bg-portal-bg px-2 py-0.5 text-xs font-semibold">{(a as Record<string, unknown>)["ruul_added_at"] ? "added" : "to add"}</span></p>
            <p className="text-xs text-brand-navySoft">Ruul sends no invitation: add the poster in Ruul's "New Contractor" form with these exact values. The poster then creates his Ruul account with the same email.</p>
            {legal === null ? <p className="text-xs font-semibold text-portal-amber">Waiting for the legal name (asked in the Sophia OS onboarding)</p> : null}
            {([...(legal === null ? [] : [["First name", legal ? legal.prenom_legal : (a.full_name.trim().split(/\s+/)[0] ?? "")], ["Last name", legal ? legal.nom_legal : a.full_name.trim().split(/\s+/).slice(1).join(" ")]] as const), ["Country", a.country]] as const).map(([l, v]) => (
              <p key={l} className="flex items-center gap-2 text-xs"><b className="w-20">{l}</b><span className="flex-1 break-all">{v || "—"}</span><Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(v); toast.success("Copied"); }}>Copy</Button></p>
            ))}
            <p className="flex items-center gap-2 text-xs"><b className="w-20">Email</b>
              <input aria-label="Ruul email" defaultValue={((a as Record<string, unknown>)["ruul_email"] as string | null) ?? a.email} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== (((a as Record<string, unknown>)["ruul_email"] as string | null) ?? a.email)) void run(() => saveRuul({ data: { applicationId: a.id, email: v } }), "Ruul email saved"); }} className="h-8 min-w-0 flex-1 rounded border px-2" />
              <Button size="sm" variant="ghost" onClick={(e) => { const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null); void navigator.clipboard.writeText(input?.value ?? a.email); toast.success("Copied"); }}>Copy</Button>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={busy} onClick={() => void run(() => ruulAdded({ data: { applicationId: a.id } }), "Marked as added in Ruul")} className={(a as Record<string, unknown>)["ruul_added_at"] ? "hidden" : ""}>Added in Ruul</Button>
              {(a as Record<string, unknown>)["ruul_added_at"] ? <span className="text-xs text-brand-navySoft">Added {fmt((a as Record<string, unknown>)["ruul_added_at"] as string)}</span> : null}
            </div>
          </div>
        ) : null}
        {!decided ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={Boolean(acceptBlock)} title={acceptBlock ?? undefined} onClick={() => setMode(mode === "accept" ? "none" : "accept")}>Accept</Button>
            {acceptBlock ? <span className="text-xs font-semibold text-portal-amber">{acceptBlock}</span> : null}
            <Button size="sm" variant="outline" onClick={() => setMode(mode === "reject" ? "none" : "reject")}>Refuse</Button>
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
            <Button size="sm" disabled={busy || !zone || !apps.length} onClick={() => void run(() => accept({ data: { applicationId: a.id, apps: apps as ("sophia" | "unswipe")[], zone: zone as "A", langue } }), "Accepted, email sent")}>Confirm acceptance</Button>
          </div>
        ) : null}
        {mode === "reject" ? (
          <div className="space-y-2 border-t border-brand-line py-3 text-sm">
            <textarea aria-label="Reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (sent to the applicant in their language)" className="w-full rounded-lg border p-2" />
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => void run(() => reject({ data: { applicationId: a.id, reason } }), "Rejected, email sent")}>Confirm refusal</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type BulkOut = { accepted: { id: string; name: string; start_monday: string }[]; skipped: { id: string; name: string; reason: string }[]; failed: { id: string; error: string }[] };

/** "Accept all (N)" for one country's pending applications; shown only when the country is open in the OS zones. */
function AcceptAllButton({ country, pending, label, selection = false }: { country: string; pending: App[]; label?: string; selection?: boolean }) {
  const qc = useQueryClient();
  const bulk = useServerFn(acceptPostersBulk);
  const { data: z } = useQuery({ queryKey: ["hub", "os-zones"], queryFn: () => osZones(), staleTime: 10 * 60_000, retry: false });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<BulkOut | null>(null);
  const iso = countryCodeOf(country);
  const isOpen = Boolean(z?.ok && iso && z.ouverts.some((o) => o.pays_code === iso));
  if (!pending.length || (!selection && !isOpen)) return null;
  const nameOf = (id: string) => pending.find((p) => p.id === id)?.full_name ?? id;
  async function go() {
    setBusy(true);
    try { setRes(await bulk({ data: { applicationIds: pending.map((p) => p.id) } }) as BulkOut); void qc.invalidateQueries({ queryKey: ["hub", "slides"] }); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <>
      <Button size="sm" className="ml-auto" onClick={(e) => { e.stopPropagation(); setRes(null); setOpen(true); }}>{label ?? `Accept all (${pending.length})`}</Button>
      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{res ? `Accept all — ${country}: summary` : `Accept all pending applications from ${country}?`}</DialogTitle>
            <DialogDescription>{res ? "Each one went through the same acceptance as the single Accept button." : "Each one is accepted like the single Accept button: start Monday, contract link and acceptance email in their language. Possible duplicates and refused applications are skipped."}</DialogDescription>
          </DialogHeader>
          {res ? (
            <div className="space-y-3 text-sm">
              <div><p className="font-bold">Accepted · {res.accepted.length}</p><ul className="list-disc pl-5">{res.accepted.map((r) => <li key={r.id}>{r.name} — starts {r.start_monday}</li>)}</ul></div>
              <div><p className="font-bold">Skipped · {res.skipped.length}</p><ul className="list-disc pl-5">{res.skipped.map((r) => <li key={r.id}>{r.name} — {r.reason}</li>)}</ul></div>
              <div><p className="font-bold">Failed · {res.failed.length}</p><ul className="list-disc pl-5">{res.failed.map((r) => <li key={r.id}>{nameOf(r.id)} — {r.error}</li>)}</ul></div>
            </div>
          ) : (
            <ul className="list-disc pl-5 text-sm">{pending.map((p) => <li key={p.id}>{p.full_name} <span className="text-brand-navySoft">({p.email})</span></li>)}</ul>
          )}
          <DialogFooter>
            {res ? <Button onClick={() => setOpen(false)}>Close</Button> : <>
              <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={busy} onClick={() => void go()}>{busy ? "Accepting…" : `Accept ${pending.length}`}</Button>
            </>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
