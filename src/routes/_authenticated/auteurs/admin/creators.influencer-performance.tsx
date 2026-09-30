import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerPerformance } from "@/components/portal/admin/InfluencersAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-performance")({
  head: () => ({ meta: [{ title: "Performance | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><InfluencerPerformance /></PortalShell>,
});
