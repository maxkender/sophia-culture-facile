import { createFileRoute, useRouter } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { RuulJourney, ruulJourneyQuery } from "@/components/hub/slides/RuulJourney";
import { Button } from "@/components/ui/button";

const search = z.object({ q:fallback(z.string(),"").default(""),step:fallback(z.string(),"").default(""),country:fallback(z.string(),"").default(""),referrer:fallback(z.string(),"").default(""),monday:fallback(z.string(),"").default(""),source:fallback(z.string(),"").default(""),red:fallback(z.boolean(),false).default(false) });
export const Route = createFileRoute("/_authenticated/hub/slideshows/parcours-ruul")({
  validateSearch:zodValidator(search),
  loader:({context})=>context.queryClient.ensureQueryData(ruulJourneyQuery),
  head:()=>({meta:[{title:"Parcours Ruul | Sophia Slideshows"},{name:"description",content:"Slideshow poster journey from referral to Ruul payment, with dates, waiting steps and follow-up."},{property:"og:title",content:"Parcours Ruul | Sophia Slideshows"},{property:"og:description",content:"Track referrals, applications, onboarding and manual Ruul payments."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex, nofollow"}]}),
  component:RuulJourney,
  pendingComponent:()=> <p role="status" className="p-4 text-sm text-muted-foreground">Loading Parcours Ruul…</p>,
  errorComponent:JourneyError,
  notFoundComponent:()=> <p>Journey not found.</p>,
});
function JourneyError() { const router=useRouter(); return <div role="alert" className="space-y-3"><p>Parcours Ruul could not be loaded.</p><Button variant="outline" onClick={()=>void router.invalidate()}>Retry</Button></div>; }