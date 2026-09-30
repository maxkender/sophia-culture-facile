import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerDealsBoard } from "@/components/portal/admin/InfluencerDealsAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-deals/")({
  head: () => ({ meta: [{ title: "Deals | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><InfluencerDealsBoard /></PortalShell>,
});
