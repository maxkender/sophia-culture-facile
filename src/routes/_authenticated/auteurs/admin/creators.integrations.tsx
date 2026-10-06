import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { IntegrationsSetup } from "@/components/portal/admin/UgcAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/integrations")({
  head: () => ({ meta: [{ title: "Integrations setup | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <IntegrationsSetup />
    </PortalShell>
  ),
});
