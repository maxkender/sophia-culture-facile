import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { DocumentsList } from "@/components/portal/admin/DocumentsList";

export const Route = createFileRoute("/_authenticated/auteurs/admin/documents/")({
  head: () => ({ meta: [{ title: "Documents | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <DocumentsList />
    </PortalShell>
  ),
});
