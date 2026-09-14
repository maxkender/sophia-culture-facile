import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorCourses } from "@/components/portal/AuthorCourses";

export const Route = createFileRoute("/_authenticated/auteurs/courses/")({
  head: () => ({ meta: [{ title: "My courses | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell>
      <AuthorCourses />
    </PortalShell>
  ),
});
