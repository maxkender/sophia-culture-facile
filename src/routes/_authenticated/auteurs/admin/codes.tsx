import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CodesPool } from "@/components/portal/admin/CodesPool";

export const Route = createFileRoute("/_authenticated/auteurs/admin/codes")({
  head: () => ({ meta: [{ title: "Access codes | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CodesPool />
    </PortalShell>
  ),
});
