import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { InfluencerApplications } from "@/components/portal/admin/InfluencerApplications";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-applications")({
  head: () => ({ meta: [{ title: "Influencer applications | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <InfluencerApplications />
    </PortalShell>
  ),
});
