import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CourseEditor } from "@/components/portal/CourseEditor";

function CourseRoute() {
  const { courseId } = Route.useParams();
  return (
    <PortalShell>
      <CourseEditor courseId={courseId} />
    </PortalShell>
  );
}

export const Route = createFileRoute("/_authenticated/auteurs/courses/$courseId")({
  head: () => ({ meta: [{ title: "Write a course | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CourseRoute,
});
