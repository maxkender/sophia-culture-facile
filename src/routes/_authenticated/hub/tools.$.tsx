import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";
import { AppsSettings } from "@/components/portal/admin/AppsSettings";
import { UgcBriefsGrid, UgcComplianceDashboard, IntegrationsSetup, WeekPlanner } from "@/components/portal/admin/UgcAdmin";
import { InfluencerApplications } from "@/components/portal/admin/InfluencerApplications";
import { InfluencerBriefDetail, InfluencerBriefsList } from "@/components/portal/admin/InfluencerBriefsAdmin";
import { InfluencerDealDetail, InfluencerDealsBoard } from "@/components/portal/admin/InfluencerDealsAdmin";
import { InfluencerInbox } from "@/components/portal/admin/InfluencerInbox";
import { InfluencerAdminDetail, InfluencerPayoutsAdmin, InfluencerPerformance, InfluencerSettingsAdmin, InfluencersGrid } from "@/components/portal/admin/InfluencersAdmin";
import { CreatorOps } from "@/components/portal/admin/CreatorOps";
import { CreatorProspects } from "@/components/portal/admin/CreatorProspects";
import { CreatorsDashboard } from "@/components/portal/admin/CreatorsDashboard";

/** Every pre-hub creator admin page, kept working inside the hub shell. */
export const TOOLS: Record<string, { label: string; render: (id?: string) => ReactNode }> = {
  overview: { label: "Programme overview", render: () => <CreatorsDashboard /> },
  "ugc-applications": { label: "UGC applications", render: () => <CreatorApplications key="ugc" track="ugc" /> },
  "slideshow-applications": { label: "Slideshow applications", render: () => <CreatorApplications key="slideshow" track="slideshow" /> },
  "ugc-briefs": { label: "UGC briefs", render: () => <UgcBriefsGrid /> },
  planner: { label: "Week planner", render: () => <WeekPlanner /> },
  compliance: { label: "Compliance", render: () => <UgcComplianceDashboard /> },
  integrations: { label: "Integrations", render: () => <IntegrationsSetup /> },
  ops: { label: "Library & operations", render: () => <CreatorOps /> },
  prospects: { label: "Prospects grid", render: () => <CreatorProspects /> },
  apps: { label: "Apps settings", render: () => <AppsSettings /> },
  "influencer-applications": { label: "Influencer applications", render: () => <InfluencerApplications /> },
  influencers: { label: "Influencers", render: (id) => (id ? <InfluencerAdminDetail influencerId={id} /> : <InfluencersGrid />) },
  "influencer-briefs": { label: "Influencer briefs", render: (id) => (id ? <InfluencerBriefDetail briefId={id} /> : <InfluencerBriefsList />) },
  "influencer-deals": { label: "Influencer deals", render: (id) => (id ? <InfluencerDealDetail dealId={id} /> : <InfluencerDealsBoard />) },
  "influencer-messages": { label: "Influencer messages", render: () => <InfluencerInbox /> },
  "influencer-payouts": { label: "Influencer payouts", render: () => <InfluencerPayoutsAdmin /> },
  "influencer-performance": { label: "Influencer performance", render: () => <InfluencerPerformance /> },
  "influencer-settings": { label: "Influencer settings", render: () => <InfluencerSettingsAdmin /> },
};

export const Route = createFileRoute("/_authenticated/hub/tools/$")({
  head: () => ({ meta: [{ title: "Tools | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function ToolsRoute() {
    const { _splat } = Route.useParams();
    const [tool, id] = (_splat ?? "").split("/");
    const t = TOOLS[tool ?? ""];
    if (t) return <>{t.render(id || undefined)}</>;
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(TOOLS).map(([k, v]) => (
          <Link key={k} to="/hub/tools/$" params={{ _splat: k }} className="rounded-2xl bg-card p-5 font-bold text-brand-navy shadow-portal hover:shadow-lg">{v.label} →</Link>
        ))}
      </div>
    );
  },
});
