import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { ApplicationsList } from "@/components/portal/admin/ApplicationsList";

export const Route = createFileRoute("/_authenticated/auteurs/admin/applications")({
  head: () => ({ meta: [{ title: "Applications | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <ApplicationsList />
    </PortalShell>
  ),
});
