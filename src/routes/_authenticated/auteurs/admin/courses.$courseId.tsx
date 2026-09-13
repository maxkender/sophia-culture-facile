import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CourseEditor } from "@/components/portal/CourseEditor";

export const Route = createFileRoute("/_authenticated/auteurs/admin/courses/$courseId")({
  head: () => ({ meta: [{ title: "Edit course | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { courseId } = Route.useParams();
  return (
    <PortalShell adminOnly>
      <CourseEditor courseId={courseId} admin />
    </PortalShell>
  );
}
