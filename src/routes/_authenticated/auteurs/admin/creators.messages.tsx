import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorInbox } from "@/components/portal/admin/CreatorInbox";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/messages")({
  head: () => ({ meta: [{ title: "Creator messages | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreatorInbox />
    </PortalShell>
  ),
});
