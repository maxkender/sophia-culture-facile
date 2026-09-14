import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { PoolCourses } from "@/components/portal/admin/PoolCourses";

export const Route = createFileRoute("/_authenticated/auteurs/admin/pool")({
  head: () => ({
    meta: [{ title: "Unassigned courses | Sophia" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: PoolRoute,
});

function PoolRoute() {
  return (
    <PortalShell adminOnly>
      <PoolCourses />
    </PortalShell>
  );
}
