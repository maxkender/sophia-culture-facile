import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AdminSettings } from "@/components/portal/admin/AdminSettings";

export const Route = createFileRoute("/_authenticated/auteurs/admin/settings")({
  head: () => ({ meta: [{ title: "Settings | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <AdminSettings />
    </PortalShell>
  ),
});
