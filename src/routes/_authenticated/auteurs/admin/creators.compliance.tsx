import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { UgcComplianceDashboard } from "@/components/portal/admin/UgcAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/compliance")({
  head: () => ({ meta: [{ title: "Creators dashboard | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <UgcComplianceDashboard />
    </PortalShell>
  ),
});
