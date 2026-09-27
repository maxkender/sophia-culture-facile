import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/applications")({
  head: () => ({ meta: [{ title: "Creator applications | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorApplications />
    </PortalShell>
  ),
});
