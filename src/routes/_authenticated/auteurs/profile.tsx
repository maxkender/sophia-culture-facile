import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorProfile } from "@/components/portal/AuthorProfile";

export const Route = createFileRoute("/_authenticated/auteurs/profile")({
  head: () => ({ meta: [{ title: "Your details | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell>
      <AuthorProfile />
    </PortalShell>
  ),
});
