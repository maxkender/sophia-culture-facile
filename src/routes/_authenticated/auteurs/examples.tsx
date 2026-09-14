import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { ExamplesPage } from "@/components/portal/ExamplesPage";

export const Route = createFileRoute("/_authenticated/auteurs/examples")({
  head: () => ({ meta: [{ title: "Examples | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell>
      <ExamplesPage />
    </PortalShell>
  ),
});
