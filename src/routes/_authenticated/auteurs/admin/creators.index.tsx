import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorsDashboard } from "@/components/portal/admin/CreatorsDashboard";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/")({
  head: () => ({ meta: [{ title: "Creators | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorsDashboard />
    </PortalShell>
  ),
});
