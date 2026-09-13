import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AdminDashboard } from "@/components/portal/admin/AdminDashboard";

export const Route = createFileRoute("/_authenticated/auteurs/admin/")({
  head: () => ({ meta: [{ title: "Editorial dashboard | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <AdminDashboard />
    </PortalShell>
  ),
});
