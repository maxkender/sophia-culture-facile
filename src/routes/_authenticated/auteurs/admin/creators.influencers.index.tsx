import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencersGrid } from "@/components/portal/admin/InfluencersAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencers/")({
  head: () => ({ meta: [{ title: "Influencers | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><InfluencersGrid /></PortalShell>,
});
