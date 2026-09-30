import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerPayoutsAdmin } from "@/components/portal/admin/InfluencersAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-payouts")({
  head: () => ({ meta: [{ title: "Influencer payouts | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><InfluencerPayoutsAdmin /></PortalShell>,
});
