import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { ActivityLog } from "@/components/portal/admin/ActivityLog";

export const Route = createFileRoute("/_authenticated/auteurs/admin/activity")({
  head: () => ({ meta: [{ title: "Activity log | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <ActivityLog />
    </PortalShell>
  ),
});
