import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorsList } from "@/components/portal/admin/AuthorsList";

export const Route = createFileRoute("/_authenticated/auteurs/admin/authors/")({
  head: () => ({ meta: [{ title: "Authors | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <AuthorsList />
    </PortalShell>
  ),
});
