import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerSettingsAdmin } from "@/components/portal/admin/InfluencersAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-settings")({
  head: () => ({ meta: [{ title: "Influencer settings | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><InfluencerSettingsAdmin /></PortalShell>,
});
