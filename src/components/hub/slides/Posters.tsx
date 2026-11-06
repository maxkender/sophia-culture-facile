import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { refreshFromOs } from "@/lib/slideshows.functions";
import { OS_NOT_CONNECTED, OS_UI_ENABLED, POSTER_STATUSES, useOsStatus } from "./useOs";
import { needsLegalName, PosterCard, scoreOf, useLegalNames, useSlideshowApps } from "./SlideshowApplications";
import { Country, DetailSheet, shortDate } from "./Crm";

const mondayOf = (d = new Date()) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
export function OsNotConnected({ what }: { what: string }) {
  if (!OS_UI_ENABLED) return null;
  return <div className="rounded-lg border border-brand-line bg-card p-3 text-xs text-brand-navySoft" data-testid="os-not-connected"><b>{what}:</b> {OS_NOT_CONNECTED}.</div>;
}
export function Posters() {
  const qc = useQueryClient(); const os = useOsStatus(); const refresh = useServerFn(refreshFromOs);
  const { data } = useSlideshowApps(); const apps = data?.apps ?? []; const { data: legal } = useLegalNames(apps);
  const [zone, setZone] = useState("all"); const [search,setSearch] = useState(""); const [ruulOnly,setRuulOnly] = useState(false); const [open,setOpen] = useState<string | null>(null);
  const lundi = mondayOf();
  const { data: snaps } = useQuery({ queryKey: ["hub","slides","snapshots",lundi], queryFn: async () => new Map(((await supabase.from("os_snapshots").select("*").eq("lundi",lundi)).data ?? []).map((s) => [s.application_id,s])) });
  const rows = apps.filter((a) => POSTER_STATUSES.includes(a.status) && (zone === "all" || a.zone === zone) && (!ruulOnly || a.payout_channel === "ruul") && `${a.full_name} ${a.email} ${a.os_email ?? ""} ${a.country}`.toLowerCase().includes(search.toLowerCase()));
  const active = apps.find((a) => a.id === open);
  return <div className="space-y-3"><p className="crm-count">{rows.length} posters · week of {shortDate(lundi)}</p><div className="crm-toolbar"><input aria-label="Search posters" className="crm-search" placeholder="Search posters" value={search} onChange={(e) => setSearch(e.target.value)} /><div className="flex gap-1">{["all","A","B","C"].map((z) => <Button key={z} size="sm" variant={zone===z ? "secondary" : "ghost"} onClick={() => setZone(z)}>{z === "all" ? "All zones" : z}</Button>)}</div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ruulOnly} onChange={(e) => setRuulOnly(e.target.checked)} />Ruul cohort only</label><Button size="sm" variant="outline" className="ml-auto" disabled={!os.data?.connected} onClick={async () => { const r = await refresh(); if (r.ok) { toast.success("Refreshed from the OS"); void qc.invalidateQueries({ queryKey:["hub","slides"] }); } else toast.error((r as {error?: string}).error ?? "Failed"); }}><RefreshCw className="size-4" />Refresh from OS</Button></div>{!os.data?.connected ? <OsNotConnected what="Weekly post counts" /> : null}
  <div className="crm-table"><table className="min-w-[1050px] text-left" data-testid="posters-table"><thead className="text-xs text-brand-navySoft"><tr>{["Name","Country","Zone","OS login","Start Monday","Posts this week","Slack","Ruul","Legal name"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((a) => { const snap=snaps?.get(a.id); const tl=a.timeline as Record<string,unknown> | null; const identity=legal?.get(a.id); return <tr key={a.id} className="cursor-pointer border-t border-brand-line" onClick={() => setOpen(a.id)}><td><Button variant="link" className="h-auto p-0 text-sm font-medium text-brand-navy" onClick={() => setOpen(a.id)}>{a.full_name}</Button></td><td><Country country={a.country} /></td><td>{a.zone ?? "—"}</td><td className="text-xs">{a.os_email ?? "—"}</td><td className="whitespace-nowrap">{shortDate(a.start_monday)}</td><td>{snap?.publies ?? "—"} / {snap?.prevus ?? "—"}</td><td>{tl?.["slack_added"] ? "✓" : "—"}</td><td>{a.ruul_added_at ? "Added" : "To add"}</td><td className="text-xs">{identity ? `${identity.prenom_legal} ${identity.nom_legal}` : needsLegalName(a) ? "Waiting for name" : "—"}</td></tr>; })}</tbody></table>{!rows.length ? <p className="p-4 text-sm text-brand-navySoft">No posters.</p> : null}</div>
  <DetailSheet open={Boolean(active)} onClose={() => setOpen(null)} title={active?.full_name ?? "Poster"} description={active?.email ?? ""}>{active ? <><p className="mb-3 text-xs">Posts this week: {snaps?.get(active.id)?.publies ?? "—"} published / {snaps?.get(active.id)?.prevus ?? "—"} planned · missed {snaps?.get(active.id)?.manques ?? "—"} · last post {shortDate(snaps?.get(active.id)?.dernier_post_at)}</p><PosterCard key={active.id} a={active} zones={data?.zones ?? []} score={scoreOf(active,data?.hmCountries ?? new Set())} legal={needsLegalName(active) ? legal?.get(active.id) ?? null : undefined} /></> : null}</DetailSheet></div>;
}
