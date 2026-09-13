import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { WritingGuidePage } from "@/components/portal/WritingGuidePage";

export const Route = createFileRoute("/_authenticated/auteurs/guide")({
  head: () => ({ meta: [{ title: "Writing guide | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell>
      <WritingGuidePage />
    </PortalShell>
  ),
});
