import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PayZonesSettings } from "@/components/portal/admin/PayZonesSettings";
import { AdminSettings } from "@/components/portal/admin/AdminSettings";
import { SlideshowApplications } from "./slides/SlideshowApplications";
import { Posters } from "./slides/Posters";
import { PosterGuideEditor } from "./slides/PosterGuideEditor";
import { SlidesPayouts } from "./slides/SlidesPayouts";
import { OsConnectionCard } from "./slides/OsConnectionCard";
import { OS_UI_ENABLED } from "./slides/useOs";

const card = "rounded-2xl bg-card p-5 shadow-portal";

/** Pill tabs that are real links, so each tab has its own URL. */
export function SectionTabs({ base, tabs, current }: { base: "/hub/settings"; tabs: [string, string][]; current: string }) {
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
function useAdmins() {
  return useQuery({
    queryKey: ["hub", "admins-hm"],
    queryFn: async () => {
      const [p, h] = await Promise.all([supabase.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name"), supabase.from("hiring_managers").select("*")]);
      return { admins: p.data ?? [], hms: h.data ?? [] };
    },
  });
}


function SettingLink({ k, label, help, compact = false }: { k: string; label: string; help: string; compact?: boolean }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["hub", "setting", k], queryFn: async () => (await supabase.from("hub_settings").select("value").eq("key", k).maybeSingle()).data?.value ?? "" });
  const [v, setV] = useState<string | null>(null);
  const val = v ?? data ?? "";
  const [editing, setEditing] = useState(false);
  return (
    <div className={compact ? "space-y-2 border-b border-brand-line py-2 text-sm" : cn(card, "space-y-3")}>
      <div className={compact ? "crm-setting-line flex items-center gap-2" : "flex flex-wrap items-center gap-2"}><span className="font-medium">{label}:</span>{data ? <a href={data} target="_blank" rel="noreferrer" className="max-w-full truncate text-portal-accent underline">{compact ? data : `Open ${label.toLowerCase()} ↗`}</a> : <span className="text-brand-navySoft">—</span>}{compact ? <><span>·</span><Button variant="link" size="sm" className="h-auto p-0" onClick={() => setEditing(!editing)}>edit</Button></> : null}</div>
      {!compact ? <p className="text-sm text-brand-navySoft">{help}</p> : null}
      {(!compact || editing) ? <div className="flex gap-2"><input aria-label={label} value={val} onChange={(e) => setV(e.target.value)} placeholder="https://…" className="h-10 flex-1 rounded-lg border px-3 text-sm" />
        <Button onClick={async () => { if (val && !/^https:\/\//.test(val)) { toast.error("Use a full link starting with https://"); return; } const { error } = await supabase.from("hub_settings").upsert({ key: k, value: val || null, updated_at: new Date().toISOString() }); if (error) toast.error("Could not save."); else { toast.success("Saved"); void qc.invalidateQueries({ queryKey: ["hub", "setting", k] }); } }}>Save</Button></div> : null}
    </div>
  );
}

export function SlideshowSection({ section, id }: { section: string; id?: string | undefined }) {
  switch (section) {
    case "applications": return <SlideshowApplications focusId={id} />;
    case "posters": return <Posters />;
    case "rates": return <PayZonesSettings compact />;
    case "payouts": return <SlidesPayouts />;
    case "guide": return (
      <div className="space-y-4">
        <div className="space-y-2">
          <SettingLink compact k="slideshow_poster_guide_url" label="Poster Guide link" help="Shared with new posters by hand with their logins." />
          <SettingLink compact k="slideshow_slack_invite_url" label="Slack invite link" help="Shared with new posters by hand with their logins." />
        </div>
        <SettingLink compact k="slideshow_platform_url" label="Old platform" help="" />
        <PosterGuideEditor />
      </div>
    );
    default: return <p className={cn(card, "text-sm")}>This page does not exist. <Link to="/hub/slideshows" className="font-bold underline">Slideshows home</Link></p>;
  }
}

/** Payments are switched off (hub_settings.payments_enabled = false); payout screens stay dormant. */
export function PaymentsOff() {
  return <p className={cn(card, "text-sm text-brand-navySoft")}>Payments are off for now. Nothing is paid and no payout is prepared.</p>;
}

/* ---------------- Settings ---------------- */
export const SETTINGS_TABS: [string, string][] = [["connections", "Connections"], ["team", "Team"], ["security", "Security"]];

const TRACKS = [["slideshow", "Slideshows"]] as const;
function Team({ track }: { track?: string } = {}) {
  const qc = useQueryClient();
  const { data } = useAdmins();
  const { data: queues = {} } = useQuery({
    queryKey: ["hub", "hm-queues", track],
    queryFn: async () => {
      const [s, i] = await Promise.all([
        supabase.from("slideshow_applications").select("assigned_hm_id").eq("status", "pending").not("assigned_hm_id", "is", null),
        Promise.resolve({ data: [] as { assigned_hm_id: string | null }[] }),
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
      <p className="text-sm text-brand-navySoft">{track === "slideshow" ? "Zones and countries each hiring manager covers. " : ""}Every admin can be a hiring manager. Tick the tracks they handle and the countries they cover; their open queue is counted from the applications assigned to them.</p>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-portal"><table className="w-full min-w-[720px] text-sm" data-testid="hm-team">
        <thead className="text-left text-xs uppercase text-brand-navySoft"><tr><th className="p-3">Person</th><th className="p-3">Hiring manager</th><th className="p-3">Tracks</th><th className="p-3">Countries</th><th className="p-3">Open queue</th></tr></thead>
        <tbody>{(data?.admins ?? []).map((a) => { const h = data?.hms.find((x) => x.profile_id === a.id); return (
          <tr key={a.id} className="border-t border-brand-line">
            <td className="p-3 font-bold">{a.full_name ?? "—"}<span className="block text-xs font-normal text-brand-navySoft">{a.email}</span></td>
            <td className="p-3"><input type="checkbox" aria-label={`Hiring manager ${a.full_name}`} checked={Boolean(h?.active)} onChange={(e) => void save(a.id, { active: e.target.checked })} /></td>
            <td className="p-3">{TRACKS.filter(([k]) => !track || k === track).map(([k, l]) => <label key={k} className="mr-3 inline-flex items-center gap-1 text-xs"><input type="checkbox" disabled={!h?.active} checked={(h?.tracks ?? []).includes(k)} onChange={(e) => void save(a.id, { tracks: e.target.checked ? [...(h?.tracks ?? []), k] : (h?.tracks ?? []).filter((x) => x !== k) })} />{l}</label>)}</td>
            <td className="p-3"><input aria-label={`Countries for ${a.full_name}`} disabled={!h?.active} defaultValue={(h?.countries ?? []).join(", ")} placeholder="FR, BE, CH" onBlur={(e) => void save(a.id, { countries: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean) })} className="h-9 w-40 rounded-lg border px-2" /></td>
            <td className="p-3">{(queues as Record<string, number>)[a.id] ?? 0}</td>
          </tr>); })}</tbody>
      </table></div>
    </div>
  );
}

export function HubSettings({ tab }: { tab?: string | undefined }) {
  const t = pick(SETTINGS_TABS, tab);
  const body: Record<string, ReactNode> = {
    connections: <div className="space-y-4">{OS_UI_ENABLED ? <OsConnectionCard /> : null}</div>,
    team: <Team track="slideshow" />,
    security: <AdminSettings />,
  };
  return <div><SectionTabs base="/hub/settings" tabs={SETTINGS_TABS} current={t} />{body[t]}</div>;
}
