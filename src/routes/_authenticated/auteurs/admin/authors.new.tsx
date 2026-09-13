import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { CreateAuthor } from "@/components/portal/admin/CreateAuthor";

export const Route = createFileRoute("/_authenticated/auteurs/admin/authors/new")({
  head: () => ({ meta: [{ title: "New author | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <CreateAuthor />
    </PortalShell>
  ),
});
