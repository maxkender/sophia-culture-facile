import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { ReviewQueue } from "@/components/portal/admin/ReviewQueue";

export const Route = createFileRoute("/_authenticated/auteurs/admin/review/")({
  head: () => ({ meta: [{ title: "Review queue | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <ReviewQueue />
    </PortalShell>
  ),
});
