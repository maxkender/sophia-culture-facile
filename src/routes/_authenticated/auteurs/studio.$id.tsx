import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { StudioEditor } from "@/components/studio/editor/StudioEditor";

function StudioRoute() {
  const { id } = Route.useParams();
  return (
    <PortalShell wide breadcrumb={[{ label: "My courses", to: "/auteurs/courses" }, { label: "Sophia Studio" }]}>
      <StudioEditor id={id} />
    </PortalShell>
  );
}

export const Route = createFileRoute("/_authenticated/auteurs/studio/$id")({
  head: () => ({ meta: [{ title: "Sophia Studio editor | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: StudioRoute,
});
