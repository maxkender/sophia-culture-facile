import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorProspects } from "@/components/portal/admin/CreatorProspects";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/prospects")({
  head: () => ({ meta: [{ title: "Prospects | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorProspects />
    </PortalShell>
  ),
});
