import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorOps } from "@/components/portal/admin/CreatorOps";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/ops")({
  head: () => ({ meta: [{ title: "Creator operations | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorOps />
    </PortalShell>
  ),
});
