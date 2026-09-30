import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerInbox } from "@/components/portal/admin/InfluencerInbox";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-messages")({
  head: () => ({ meta: [{ title: "Influencer messages | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <InfluencerInbox />
    </PortalShell>
  ),
});
