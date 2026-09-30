import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerDealDetail } from "@/components/portal/admin/InfluencerDealsAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-deals/$dealId")({
  head: () => ({ meta: [{ title: "Influencer deal | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function Page() { const { dealId } = Route.useParams(); return <PortalShell adminOnly><InfluencerDealDetail dealId={dealId} /></PortalShell>; },
});
