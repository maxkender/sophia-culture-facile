import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerAdminDetail } from "@/components/portal/admin/InfluencersAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencers/$influencerId")({
  head: () => ({ meta: [{ title: "Influencer | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function Page() { const { influencerId } = Route.useParams(); return <PortalShell adminOnly><InfluencerAdminDetail influencerId={influencerId} /></PortalShell>; },
});
