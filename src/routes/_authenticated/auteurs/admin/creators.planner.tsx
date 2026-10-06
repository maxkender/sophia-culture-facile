import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { WeekPlanner } from "@/components/portal/admin/UgcAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/planner")({
  head: () => ({ meta: [{ title: "Week planner | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <WeekPlanner />
    </PortalShell>
  ),
});
