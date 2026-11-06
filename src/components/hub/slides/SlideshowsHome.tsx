import { Link } from "@tanstack/react-router";
import { needsLegalName, useLegalNames, useSlideshowApps } from "./SlideshowApplications";
import { useOsStatus, OS_UI_ENABLED } from "./useOs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { osZones } from "@/lib/slideshows.functions";
import { countryCodeOf } from "@/config/countries";
import { OsNotConnected } from "./Posters";

export function SlideshowsHome() {
  const { data } = useSlideshowApps(); const os = useOsStatus(); const apps=data?.apps ?? []; const {data:legal}=useLegalNames(apps);
  const inOs=apps.filter(needsLegalName); const ready=inOs.filter((a)=>legal?.has(a.id)).length;
  const now=new Date(); const day=new Date(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(now)+"T12:00:00Z"); const week=new Date(day); week.setUTCDate(week.getUTCDate()-((week.getUTCDay()+6)%7)); const next=new Date(week); next.setUTCDate(next.getUTCDate()+7); const nextMonday=next.toISOString().slice(0,10);
  const {data:payouts=[]}=useQuery({queryKey:["hub","slides","payouts-to-approve"],queryFn:async()=> (await supabase.from("slideshow_payouts").select("id,week_start").eq("status","draft")).data ?? []});
  const {data:slackUrl,isPending:slackLoading}=useQuery({queryKey:["hub","setting","slideshow_slack_invite_url"],queryFn:async()=>(await supabase.from("hub_settings").select("value").eq("key","slideshow_slack_invite_url").maybeSingle()).data?.value ?? null});
  const {data:zones}=useQuery({queryKey:["hub","os-zones"],queryFn:()=>osZones(),staleTime:600000,retry:false});
  const pending=apps.filter((a)=>a.status==="pending"); const openPending=pending.filter((a)=>zones?.ok && zones.ouverts.some((z)=>z.pays_code===countryCodeOf(a.country))).length;
  const ruulToAdd=apps.filter((a)=>!a.ruul_added_at && ["contract_signed","os_created","started"].includes(a.status)).length;
  const tiles: [string,number,string][]=[["Pending",pending.length,"applications"],["Starting next Monday",apps.filter((a)=>a.start_monday===nextMonday && ["accepted","contract_signed","os_created"].includes(a.status)).length,"posters"],["Started",apps.filter((a)=>a.status==="started").length,"posters"],["Payouts to approve",payouts.length,"payouts"],["To add in Ruul",ruulToAdd,"applications"]];
  const tasks:[string,string][]=[];
  if(openPending) tasks.push([`${openPending} pending in open countries → Applications`,"applications"]);
  if(inOs.length-ready) tasks.push([`${inOs.length-ready} posters waiting for their legal name → Posters`,"posters"]);
  if(ready) tasks.push([`${ready} posters ready to add in Ruul → Posters`,"posters"]);
  for(const start of [...new Set(payouts.map((p)=>p.week_start))]) {const d=new Date(start+"T00:00:00Z"); d.setUTCDate(d.getUTCDate()+3-((d.getUTCDay()+6)%7)); const first=new Date(Date.UTC(d.getUTCFullYear(),0,4)); const wn=1+Math.round(((d.getTime()-first.getTime())/86400000-3+((first.getUTCDay()+6)%7))/7); tasks.push([`Payouts of week ${wn} to approve → Payouts`,"payouts"]);}
  return <div className="space-y-5"><p className="crm-count">{apps.length} applications · {tiles[2]?.[1] ?? 0} started</p>{!slackLoading && !slackUrl ? <p className="rounded-lg border border-portal-amber/40 bg-portal-amber/10 p-3 text-xs text-portal-amber">Slack invite link is empty. <Link to="/hub/slideshows/$section" params={{section:"guide"}} className="underline">Guide & links</Link></p> : null}<div className="grid grid-cols-5 divide-x divide-brand-line border-y border-brand-line bg-card">{tiles.map(([label,count,section])=><Link key={label} to="/hub/slideshows/$section" params={{section}} className="min-w-0 px-2 py-3 sm:px-4"><span className="block text-[10px] leading-tight text-brand-navySoft sm:text-xs">{label}</span><span className="mt-2 block text-xl font-semibold text-brand-navy">{count}</span></Link>)}</div><section><h2 className="mb-2 font-semibold">To do</h2><ul className="divide-y divide-brand-line border-y border-brand-line">{tasks.map(([label,section])=><li key={label}><Link to="/hub/slideshows/$section" params={{section}} className="block py-3 text-sm text-brand-navy">{label}</Link></li>)}</ul>{!tasks.length ? <p className="py-3 text-sm text-brand-navySoft">Nothing waiting.</p> : null}</section>{OS_UI_ENABLED && !os.data?.connected ? <OsNotConnected what="Sophia OS"/> : null}</div>;
}
