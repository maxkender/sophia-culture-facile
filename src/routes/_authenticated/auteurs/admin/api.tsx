import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { ApiDocs } from "@/components/portal/admin/ApiDocs";

export const Route = createFileRoute("/_authenticated/auteurs/admin/api")({
  head: () => ({
    meta: [{ title: "App export API | Sophia" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ApiRoute,
});

function ApiRoute() {
  return (
    <PortalShell adminOnly>
      <ApiDocs />
    </PortalShell>
  );
}
