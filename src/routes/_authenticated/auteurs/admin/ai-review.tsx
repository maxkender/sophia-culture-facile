import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AiReviewDocs } from "@/components/portal/admin/AiReviewDocs";

export const Route = createFileRoute("/_authenticated/auteurs/admin/ai-review")({
  head: () => ({ meta: [{ title: "AI reviewer | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <AiReviewDocs />
    </PortalShell>
  ),
});
