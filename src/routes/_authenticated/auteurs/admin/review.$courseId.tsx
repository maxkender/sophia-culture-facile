import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { ReviewCourse } from "@/components/portal/admin/ReviewCourse";

function ReviewRoute() {
  const { courseId } = Route.useParams();
  return (
    <PortalShell adminOnly>
      <ReviewCourse courseId={courseId} />
    </PortalShell>
  );
}

export const Route = createFileRoute("/_authenticated/auteurs/admin/review/$courseId")({
  head: () => ({ meta: [{ title: "Review course | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ReviewRoute,
});
