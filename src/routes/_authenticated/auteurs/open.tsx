import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { OpenCourses } from "@/components/portal/OpenCourses";

export const Route = createFileRoute("/_authenticated/auteurs/open")({
  head: () => ({
    meta: [{ title: "Open courses | Sophia" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: OpenRoute,
});

function OpenRoute() {
  return (
    <PortalShell>
      <OpenCourses />
    </PortalShell>
  );
}
