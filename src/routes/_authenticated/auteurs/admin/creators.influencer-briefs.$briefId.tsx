import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerBriefDetail } from "@/components/portal/admin/InfluencerBriefsAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-briefs/$briefId")({
  head: () => ({ meta: [{ title: "Influencer brief | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function Page() { const { briefId } = Route.useParams(); return <PortalShell adminOnly><InfluencerBriefDetail briefId={briefId} /></PortalShell>; },
});
