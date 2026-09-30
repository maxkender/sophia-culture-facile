import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerBriefsList } from "@/components/portal/admin/InfluencerBriefsAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-briefs/")({
  head: () => ({ meta: [{ title: "Briefs & offers | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><InfluencerBriefsList /></PortalShell>,
});
