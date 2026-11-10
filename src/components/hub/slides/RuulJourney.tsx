import { useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRuulJourney } from "@/lib/ruul-journey.functions";
import { JOURNEY_STEPS, journeyCsv, type JourneyRow } from "@/lib/ruul-journey";
import { cn } from "@/lib/utils";
import { Country, DetailSheet, shortDate } from "./Crm";
import { PosterCard, scoreOf } from "./SlideshowApplications";
import { SOURCE_LABELS } from "@/lib/slideshow-attribution";

export const ruulJourneyQuery = queryOptions({ queryKey: ["hub", "slides", "journey"], queryFn: () => getRuulJourney(), staleTime: 60_000 });
const route = getRouteApi("/_authenticated/hub/slideshows/parcours-ruul");

function Filter({ label, value, options, onChange }: { label: string; value: string; options: {value:string;label:string}[]; onChange:(value:string)=>void }) {
  return <Select value={value || "all"} onValueChange={v => onChange(v === "all" ? "" : v)}><SelectTrigger aria-label={label} className="w-full sm:w-40"><SelectValue placeholder={label} /></SelectTrigger><SelectContent><SelectItem value="all">{label}: all</SelectItem>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>;
}
function DateChip({ value, label, observed = false }: {value:string|null;label:string;observed?:boolean}) {
  return value ? <span title={`${label}: ${value}${observed ? " (earliest observed post, not confirmed first post)" : ""}`} className="inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-xs bg-portal-green/10 text-portal-green">{shortDate(value)}{observed ? "*" : ""}</span> : <span className="text-muted-foreground" aria-label={`${label}: not recorded`}>—</span>;
}
export function RuulJourney() {
  const { data } = useSuspenseQuery(ruulJourneyQuery);
  const filters = route.useSearch();
  const navigate = route.useNavigate();
  const [open, setOpen] = useState<string|null>(null);
  const set = (key: "q"|"step"|"country"|"referrer"|"monday"|"source", value:string) => void navigate({search: prev => ({...prev,[key]:value})});
  const options = (key: "country"|"referrer"|"startMonday") => [...new Set(data.rows.map(r=>r[key]).filter(Boolean))].sort().map(v=>({value:v,label:v}));
  const rows = data.rows.filter(r =>
    (!filters.q || `${r.name} ${r.email}`.toLowerCase().includes(filters.q.trim().toLowerCase())) &&
    (!filters.step || r.current === filters.step) && (!filters.red || r.red) &&
    (!filters.source || r.source === filters.source) && (!filters.country || r.country === filters.country) &&
    (!filters.referrer || r.referrer === filters.referrer) && (!filters.monday || r.startMonday === filters.monday));
  const active = data.rows.find(r=>r.id===open);
  const app = data.applications.find(a=>a.id===active?.applicationId);
  const week = new Date(data.now); week.setUTCHours(0,0,0,0); week.setUTCDate(week.getUTCDate()-((week.getUTCDay()+6)%7));
  const inWeek = (d:string|null) => Boolean(d && Date.parse(d)>=week.getTime() && Date.parse(d)<=Date.parse(data.now));
  const counts = { signed:data.rows.filter(r=>inWeek(r.dates.signed)).length, ruul:data.rows.filter(r=>inWeek(r.dates.ruul)).length, paid:data.paidThisWeek };
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([journeyCsv(rows)],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a"); link.href=url; link.download="parcours-ruul.csv"; link.click(); URL.revokeObjectURL(url);
  }
  const reminderDetail = (r:JourneyRow) => <div className="flex flex-col gap-1"><span className="flex items-center gap-1 text-xs text-muted-foreground">J+2 <DateChip value={r.reminderDates.j2} label="J+2 sent" /></span><span className="flex items-center gap-1 text-xs text-muted-foreground">J+5 <DateChip value={r.reminderDates.j5} label="J+5 sent" /></span></div>;
  return <div className="slides-crm min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-semibold">Parcours Ruul</h1><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>void navigate({search:{}})} title="Reset filters"><RotateCcw className="size-4"/><span>Reset</span></Button><Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-4"/>CSV</Button></div></div>
    {!data.referralsConnected && <div role="status" className="rounded-md border border-brand-line bg-portal-amber/10 px-3 py-2 text-sm text-foreground">Referral data not connected yet</div>}
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-brand-line py-3 text-sm"><strong className="text-portal-red">{data.rows.filter(r=>r.red).length} red rows</strong><span>This week: <b>{counts.signed}</b> signed · <b>{counts.ruul}</b> added in Ruul · <b>{counts.paid}</b> paid</span><span className="text-muted-foreground">{data.rows.length} people</span></div>
    <div className="grid grid-cols-3 gap-x-4 gap-y-2 border-b border-brand-line pb-3 sm:grid-cols-6 xl:grid-cols-12" aria-label="Journey funnel">{JOURNEY_STEPS.map(([key,label])=><div key={key} className="min-w-0"><b className="block text-lg tabular-nums">{data.rows.filter(r=>Boolean(r.dates[key])).length}</b><span className="block text-xs text-muted-foreground">{label}</span></div>)}</div>
    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
      <Input aria-label="Search name or email" placeholder="Search name or email" className="sm:max-w-64" value={filters.q} onChange={e=>set("q",e.target.value)} />
      <Filter label="Step" value={filters.step} options={[...JOURNEY_STEPS.map(([value,label])=>({value,label})),{value:"ended",label:"Ended"},{value:"complete",label:"Complete"}]} onChange={v=>set("step",v)}/>
      <Filter label="Source" value={filters.source} options={Object.entries(SOURCE_LABELS).map(([value,label])=>({value,label}))} onChange={v=>set("source",v)}/>
      <Filter label="Country" value={filters.country} options={options("country")} onChange={v=>set("country",v)}/>
      <Filter label="Referrer" value={filters.referrer} options={options("referrer")} onChange={v=>set("referrer",v)}/>
      <Filter label="Start Monday" value={filters.monday} options={options("startMonday")} onChange={v=>set("monday",v)}/>
      <label className="flex h-9 items-center gap-2 text-sm"><Checkbox checked={filters.red} onCheckedChange={v=>void navigate({search:prev=>({...prev,red:v===true})})}/>Red only</label>
    </div>
    <p className="crm-count">{rows.length} of {data.rows.length} people</p>
    <div className="crm-table max-h-[70dvh]" tabIndex={0} aria-label="Ruul journey table"><table className="whitespace-nowrap"><thead className="sticky top-0 z-10 bg-card"><tr><th className="text-left">Person</th><th>Country</th><th>Zone</th><th className="text-left">Referrer</th><th>Source</th><th className="text-left">Current step</th><th>Days stuck</th><th className="text-left">Next action</th>{JOURNEY_STEPS.map(([k,l])=><th key={k}>{l}</th>)}</tr></thead><tbody>
      {rows.map(r=><tr key={r.id} className={cn("cursor-pointer border-t border-brand-line",r.ended ? "text-muted-foreground bg-muted/50" : r.red ? "bg-portal-red/5" : "")} onClick={()=>setOpen(r.id)}>
        <td><Button variant="link" className="h-auto min-w-48 justify-start p-0 text-left text-inherit" onClick={e=>{e.stopPropagation();setOpen(r.id)}}><span><span className="block font-medium">{r.name}</span><span className="block text-xs text-muted-foreground">{r.email || "No email"}</span></span></Button></td>
        <td><Country country={r.country}/></td><td>{r.zone||"—"}</td><td>{r.referrer||"—"}{r.referrerChannel && <span className="block text-xs text-muted-foreground">{r.referrerChannel}</span>}</td><td>{SOURCE_LABELS[r.source]}{r.sourceDeclared && <span className="block text-xs text-muted-foreground">declared</span>}</td>
        <td><span className={cn("rounded px-2 py-1 text-xs",r.red ? "text-portal-red bg-portal-red/10" : r.ended ? "bg-muted" : "bg-space-slides/10 text-space-slides")}>{r.currentLabel}</span></td><td className={cn("text-center tabular-nums",r.red && "font-semibold text-portal-red")}>{r.daysStuck??"—"}</td><td className="max-w-72 whitespace-normal text-sm">{r.nextAction}</td>
        {JOURNEY_STEPS.map(([k,l])=><td key={k} className="text-center">{k==="reminders" ? reminderDetail(r) : <DateChip value={r.dates[k]} label={l} observed={k==="post" && r.postObserved}/>}</td>)}
      </tr>)}
      {!rows.length && <tr><td colSpan={20} className="py-8 text-center text-muted-foreground">No people match these filters.</td></tr>}
    </tbody></table></div>
    {active && <DetailSheet open onClose={()=>setOpen(null)} title={active.name} description={active.email||"No email"}>
      {app ? <PosterCard a={app} zones={data.zones} score={scoreOf(app,new Set())}/> : <div className="space-y-3 text-sm"><p>{active.nextAction}</p><dl className="grid grid-cols-2 gap-2"><dt>Country</dt><dd>{active.country||"—"}</dd><dt>Referrer</dt><dd>{active.referrer||"—"}</dd><dt>Channel</dt><dd>{active.referrerChannel||"—"}</dd><dt>Opened</dt><dd>{shortDate(active.openedAt)}</dd><dt>Clicked</dt><dd>{shortDate(active.clickedAt)}</dd><dt>Bonus</dt><dd>{active.bonusStatus||"—"}</dd></dl>{JOURNEY_STEPS.map(([k,l])=><div key={k} className="flex justify-between border-b border-brand-line py-2"><span>{l}</span><DateChip label={l} value={active.dates[k]}/></div>)}</div>}
    </DetailSheet>}
  </div>;
}