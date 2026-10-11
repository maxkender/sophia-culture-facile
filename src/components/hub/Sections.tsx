import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppBadge, useAdminApp } from "@/lib/apps";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";
import { PayZonesSettings } from "@/components/portal/admin/PayZonesSettings";
import { DocumentEditor } from "@/components/portal/admin/DocumentEditor";
import { InfluencerApplications } from "@/components/portal/admin/InfluencerApplications";
import { InfluencerBriefDetail, InfluencerBriefsList } from "@/components/portal/admin/InfluencerBriefsAdmin";
import { InfluencerDealDetail, InfluencerDealsBoard } from "@/components/portal/admin/InfluencerDealsAdmin";
import { InfluencerInbox } from "@/components/portal/admin/InfluencerInbox";
import { InfluencerAdminDetail, InfluencerPayoutsAdmin, InfluencerPerformance, InfluencerSettingsAdmin, InfluencersGrid } from "@/components/portal/admin/InfluencersAdmin";
import { AppsSettings } from "@/components/portal/admin/AppsSettings";
import { CodesPool } from "@/components/portal/admin/CodesPool";
import { AdminSettings } from "@/components/portal/admin/AdminSettings";
import { IntegrationsSetup } from "@/components/portal/admin/UgcAdmin";
import { HubPayouts } from "./HubPayouts";

const card = "rounded-2xl bg-card p-5 shadow-portal";

/** Pill tabs that are real links, so each tab has its own URL. */
export function SectionTabs({ base, tabs, current }: { base: "/hub/slideshows" | "/hub/influencers" | "/hub/settings" | "/hub/payouts"; tabs: [string, string][]; current: string }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-brand-line" role="tablist">
      {tabs.map(([k, l]) => (
        <Link key={k} to={base} search={{ tab: k } as never} role="tab" aria-selected={current === k}
          className={cn("shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold", current === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft hover:text-brand-navy")}>{l}</Link>
      ))}
    </div>
  );
}
const pick = (tabs: [string, string][], t?: string) => (tabs.some(([k]) => k === t) ? t! : tabs[0]![0]);

/* ---------------- Slideshows ---------------- */
export const SLIDESHOW_TABS: [string, string][] = [["applications", "Applications"], ["assign", "Hiring managers"], ["creators", "Slideshow creators"], ["zones", "Pay zones"], ["guide", "Guide"], ["platform", "Old platform"]];

function useAdmins() {
  return useQuery({
    queryKey: ["hub", "admins-hm"],
    queryFn: async () => {
      const [p, h] = await Promise.all([supabase.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name"), supabase.from("hiring_managers").select("*")]);
      return { admins: p.data ?? [], hms: h.data ?? [] };
    },
  });
}

function SlideshowAssign() {
  const { appId } = useAdminApp();
  const qc = useQueryClient();
  const { data: team } = useAdmins();
  const [onlyOpen, setOnlyOpen] = useState(true);
  const { data = [] } = useQuery({
    queryKey: ["hub", "slideshow-assign", appId],
    queryFn: async () => {
      let q = supabase.from("slideshow_applications").select("id, full_name, country, zone, zone_override, status, assigned_hm_id, created_at, app_id").order("created_at", { ascending: false });
      if (appId) q = q.eq("app_id", appId);
      return (await q).data ?? [];
    },
  });
  const hmIds = new Set((team?.hms ?? []).filter((h) => h.active).map((h) => h.profile_id));
  const choices = (team?.admins ?? []).filter((a) => hmIds.size === 0 || hmIds.has(a.id));
  const rows = data.filter((r) => !onlyOpen || r.status === "pending");
  async function assign(id: string, hm: string) {
    const { error } = await supabase.from("slideshow_applications").update({ assigned_hm_id: hm || null }).eq("id", id);
    if (error) toast.error("Could not assign."); else { toast.success(hm ? "Hiring manager assigned" : "Unassigned"); void qc.invalidateQueries({ queryKey: ["hub", "slideshow-assign"] }); }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-brand-navySoft"><b className="text-brand-navy">{data.filter((r) => r.status === "pending").length}</b> pending · {data.filter((r) => !r.assigned_hm_id && r.status === "pending").length} without a hiring manager</p>
        <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />Pending only</label>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal">
        <table className="w-full min-w-[640px] text-sm" data-testid="slideshow-assign">
          <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Slideshow creator</th><th className="p-3">Country</th><th className="p-3">Zone</th><th className="p-3">Status</th><th className="p-3">Hiring manager</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-brand-line">
              <td className="p-3 font-bold text-brand-navy"><AppBadge appId={r.app_id} /> {r.full_name}</td>
              <td className="p-3">{r.country}</td>
              <td className="p-3">{r.zone_override ?? r.zone ?? <span className="text-portal-red">none</span>}</td>
              <td className="p-3">{r.status}</td>
              <td className="p-3"><select aria-label={`Hiring manager for ${r.full_name}`} value={r.assigned_hm_id ?? ""} onChange={(e) => void assign(r.id, e.target.value)} className="h-9 rounded-lg border px-2"><option value="">—</option>{choices.map((a) => <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>)}</select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function SlideshowCreators() {
  const { appId } = useAdminApp();
  const { data = [] } = useQuery({
    queryKey: ["hub", "slideshow-creators", appId],
    queryFn: async () => {
      let q = supabase.from("slideshow_applications").select("id, full_name, email, country, zone, zone_override, status, agreement_signed_at, guide_opened_at, app_id").in("status", ["approved", "accepted"]).order("agreement_signed_at", { ascending: false, nullsFirst: false });
      if (appId) q = q.eq("app_id", appId);
      return (await q).data ?? [];
    },
  });
  if (!data.length) return <p className={cn(card, "text-sm text-brand-navySoft")}>No accepted slideshow creators yet. Accept an application to send the signature link.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-card shadow-portal"><table className="w-full min-w-[640px] text-sm">
      <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Name</th><th className="p-3">Country · zone</th><th className="p-3">Agreement</th><th className="p-3">Guide</th></tr></thead>
      <tbody>{data.map((r) => <tr key={r.id} className="border-t border-brand-line"><td className="p-3 font-bold">{r.full_name}<span className="block text-xs font-normal text-brand-navySoft">{r.email}</span></td><td className="p-3">{r.country} · {r.zone_override ?? r.zone ?? "—"}</td><td className="p-3">{r.agreement_signed_at ? `Signed ${new Date(r.agreement_signed_at).toLocaleDateString()}` : "Waiting for signature"}</td><td className="p-3">{r.guide_opened_at ? "Opened" : "Not opened"}</td></tr>)}</tbody>
    </table></div>
  );
}

function SettingLink({ k, label, help }: { k: string; label: string; help: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["hub", "setting", k], queryFn: async () => (await supabase.from("hub_settings").select("value").eq("key", k).maybeSingle()).data?.value ?? "" });
  const [v, setV] = useState<string | null>(null);
  const val = v ?? data ?? "";
  return (
    <div className={cn(card, "space-y-3")}>
      <h3 className="font-extrabold text-brand-navy">{label}</h3>
      <p className="text-sm text-brand-navySoft">{help}</p>
      {data ? <a href={data} target="_blank" rel="noreferrer" className="inline-flex font-bold text-portal-accent">Open {label.toLowerCase()} ↗</a> : <p className="text-sm text-portal-amber">No link saved yet.</p>}
      <div className="flex gap-2"><input aria-label={label} value={val} onChange={(e) => setV(e.target.value)} placeholder="https://…" className="h-10 flex-1 rounded-lg border px-3 text-sm" />
        <Button onClick={async () => { if (val && !/^https:\/\//.test(val)) { toast.error("Use a full link starting with https://"); return; } const { error } = await supabase.from("hub_settings").upsert({ key: k, value: val || null, updated_at: new Date().toISOString() }); if (error) toast.error("Could not save."); else { toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "setting", k] }); } }}>Save</Button></div>
    </div>
  );
}

export function Slideshows({ tab }: { tab?: string | undefined }) {
  const t = pick(SLIDESHOW_TABS, tab);
  const body: Record<string, ReactNode> = {
    applications: <CreatorApplications key="slideshow" track="slideshow" />,
    assign: <SlideshowAssign />,
    creators: <SlideshowCreators />,
    zones: <PayZonesSettings />,
    guide: <DocumentEditor slug={"slideshow-guide" as never} />,
    platform: <SettingLink k="slideshow_platform_url" label="Old slideshow platform" help="Where slideshow creators used to work. Kept here so the team can still open it." />,
  };
  return <div><SectionTabs base="/hub/slideshows" tabs={SLIDESHOW_TABS} current={t} />{body[t]}</div>;
}

/* ---------------- Influencers ---------------- */
export const INFLUENCER_TABS: [string, string][] = [["applications", "Applications"], ["influencers", "Influencers"], ["offers", "Briefs & offers"], ["deals", "Deals"], ["messages", "Messages"], ["performance", "Attribution & performance"], ["agreement", "Master agreement"], ["settings", "Rights & settings"]];

export function Influencers({ tab, id }: { tab?: string | undefined; id?: string | undefined }) {
  const t = pick(INFLUENCER_TABS, tab);
  const body: Record<string, ReactNode> = {
    applications: <InfluencerApplications />,
    influencers: id ? <InfluencerAdminDetail influencerId={id} /> : <InfluencersGrid />,
    offers: id ? <InfluencerBriefDetail briefId={id} /> : <InfluencerBriefsList />,
    deals: id ? <InfluencerDealDetail dealId={id} /> : <InfluencerDealsBoard />,
    messages: <InfluencerInbox />,
    performance: <InfluencerPerformance />,
    agreement: <DocumentEditor slug={"influencer-agreement" as never} />,
    settings: <InfluencerSettingsAdmin />,
  };
  return <div><SectionTabs base="/hub/influencers" tabs={INFLUENCER_TABS} current={t} />{body[t]}</div>;
}

/* ---------------- Settings ---------------- */
export const SETTINGS_TABS: [string, string][] = [["apps", "Apps & store links"], ["codes", "Access codes"], ["email", "Email"], ["connections", "Connections"], ["team", "Team & hiring managers"], ["security", "Security"]];

const TRACKS = [["ugc", "Creators (UGC)"], ["slideshow", "Slideshow creators"], ["influencer", "Influencers"]] as const;
function Team() {
  const qc = useQueryClient();
  const { data } = useAdmins();
  const { data: queues = {} } = useQuery({
    queryKey: ["hub", "hm-queues"],
    queryFn: async () => {
      const [s, i] = await Promise.all([
        supabase.from("slideshow_applications").select("assigned_hm_id").eq("status", "pending").not("assigned_hm_id", "is", null),
        supabase.from("influencer_applications").select("assigned_hm_id").eq("status", "pending").not("assigned_hm_id", "is", null),
      ]);
      const q: Record<string, number> = {};
      for (const r of [...(s.data ?? []), ...(i.data ?? [])]) q[r.assigned_hm_id as string] = (q[r.assigned_hm_id as string] ?? 0) + 1;
      return q;
    },
  });
  const reload = () => void qc.invalidateQueries({ queryKey: ["hub", "admins-hm"] });
  async function save(profileId: string, patch: { countries?: string[]; tracks?: string[]; active?: boolean }) {
    const cur = data?.hms.find((h) => h.profile_id === profileId);
    const { error } = await supabase.from("hiring_managers").upsert({ profile_id: profileId, countries: patch.countries ?? cur?.countries ?? [], tracks: patch.tracks ?? cur?.tracks ?? ["slideshow"], active: patch.active ?? cur?.active ?? true });
    if (error) toast.error("Could not save."); else reload();
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navySoft">Every admin can be a hiring manager. Tick the tracks they handle and the countries they cover; their open queue is counted from the applications assigned to them.</p>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal"><table className="w-full min-w-[720px] text-sm" data-testid="hm-team">
        <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Person</th><th className="p-3">Hiring manager</th><th className="p-3">Tracks</th><th className="p-3">Countries</th><th className="p-3">Open queue</th></tr></thead>
        <tbody>{(data?.admins ?? []).map((a) => { const h = data?.hms.find((x) => x.profile_id === a.id); return (
          <tr key={a.id} className="border-t border-brand-line">
            <td className="p-3 font-bold">{a.full_name ?? "—"}<span className="block text-xs font-normal text-brand-navySoft">{a.email}</span></td>
            <td className="p-3"><input type="checkbox" aria-label={`Hiring manager ${a.full_name}`} checked={Boolean(h?.active)} onChange={(e) => void save(a.id, { active: e.target.checked })} /></td>
            <td className="p-3">{TRACKS.map(([k, l]) => <label key={k} className="mr-3 inline-flex items-center gap-1 text-xs"><input type="checkbox" disabled={!h?.active} checked={(h?.tracks ?? []).includes(k)} onChange={(e) => void save(a.id, { tracks: e.target.checked ? [...(h?.tracks ?? []), k] : (h?.tracks ?? []).filter((x) => x !== k) })} />{l}</label>)}</td>
            <td className="p-3"><input aria-label={`Countries for ${a.full_name}`} disabled={!h?.active} defaultValue={(h?.countries ?? []).join(", ")} placeholder="FR, BE, CH" onBlur={(e) => void save(a.id, { countries: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) })} className="h-9 w-40 rounded-lg border px-2" /></td>
            <td className="p-3">{(queues as Record<string, number>)[a.id] ?? 0}</td>
          </tr>); })}</tbody>
      </table></div>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="space-y-4">
      <div className={cn(card, "space-y-2 text-sm")}>
        <h3 className="font-extrabold text-brand-navy">Emails to creators</h3>
        <p className="text-brand-navySoft">Acceptance, welcome and follow-up emails are sent through Brevo from the verified sophia-culture.com address. Subjects and texts are edited in Library → Templates.</p>
        <Button asChild variant="outline"><Link to="/hub/learn">Open Library → Templates</Link></Button>
      </div>
      <IntegrationsSetup />
    </div>
  );
}

export function HubSettings({ tab }: { tab?: string | undefined }) {
  const t = pick(SETTINGS_TABS, tab);
  const body: Record<string, ReactNode> = {
    apps: <AppsSettings />, codes: <CodesPool />, email: <EmailSettings />, connections: <IntegrationsSetup />, team: <Team />, security: <AdminSettings />,
  };
  return <div><SectionTabs base="/hub/settings" tabs={SETTINGS_TABS} current={t} />{body[t]}</div>;
}

/* ---------------- Payouts (three tracks) ---------------- */
export const PAYOUT_TABS: [string, string][] = [["ugc", "Creators (UGC)"], ["slideshow", "Slideshow creators"], ["influencer", "Influencers"]];
export function PayoutsSection({ tab }: { tab?: string | undefined }) {
  const t = pick(PAYOUT_TABS, tab);
  return (
    <div>
      <SectionTabs base="/hub/payouts" tabs={PAYOUT_TABS} current={t} />
      {t === "ugc" ? <HubPayouts /> : t === "influencer" ? <InfluencerPayoutsAdmin /> : (
        <div className="space-y-4">
          <p className={cn(card, "text-sm text-brand-navySoft")}>Slideshow creators are paid by the zone of the country they live in. Their monthly lines are created in the same batches as UGC (Creators tab), with the zone rate below.</p>
          <PayZonesSettings />
        </div>
      )}
    </div>
  );
}
