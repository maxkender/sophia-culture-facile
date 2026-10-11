import { createFileRoute } from "@tanstack/react-router";
import { CreatorDetail } from "@/components/portal/admin/CreatorDetail";

export const Route = createFileRoute("/_authenticated/hub/ugc/creators/$creatorId")({
  head: () => ({ meta: [{ title: "Creator | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function CreatorRoute() {
    const { creatorId } = Route.useParams();
    return <CreatorDetail creatorId={creatorId} />;
  },
});
