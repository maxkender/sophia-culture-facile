import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreatorDetail } from "@/components/portal/admin/CreatorDetail";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/$creatorId")({
  head: () => ({ meta: [{ title: "Creator | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function CreatorDetailRoute() {
    const { creatorId } = Route.useParams();
    return (
      <PortalShell adminOnly breadcrumb={[{ label: "Creators", to: "/auteurs/admin/creators/ops" }, { label: "Creator" }]}>
        <CreatorDetail creatorId={creatorId} />
      </PortalShell>
    );
  },
});
