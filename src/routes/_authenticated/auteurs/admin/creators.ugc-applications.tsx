import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/ugc-applications")({
  head: () => ({ meta: [{ title: "UGC applications | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorApplications key="ugc" track="ugc" />
    </PortalShell>
  ),
});
