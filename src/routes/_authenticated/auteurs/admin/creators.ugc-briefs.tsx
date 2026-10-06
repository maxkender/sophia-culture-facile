import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { UgcBriefsGrid } from "@/components/portal/admin/UgcAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/ugc-briefs")({
  head: () => ({ meta: [{ title: "UGC briefs | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <UgcBriefsGrid />
    </PortalShell>
  ),
});
