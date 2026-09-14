import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CoursesList } from "@/components/portal/admin/CoursesList";

export const Route = createFileRoute("/_authenticated/auteurs/admin/courses/")({
  head: () => ({ meta: [{ title: "Courses | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CoursesList />
    </PortalShell>
  ),
});
