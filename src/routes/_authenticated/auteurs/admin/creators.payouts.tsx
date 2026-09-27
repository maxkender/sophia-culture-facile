import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorPayouts } from "@/components/portal/admin/CreatorPayouts";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/payouts")({
  head: () => ({ meta: [{ title: "Creator payouts | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorPayouts />
    </PortalShell>
  ),
});
