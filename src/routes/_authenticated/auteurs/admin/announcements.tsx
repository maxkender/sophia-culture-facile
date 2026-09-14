import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AnnouncementsAdmin } from "@/components/portal/admin/AnnouncementsAdmin";

export const Route = createFileRoute("/_authenticated/auteurs/admin/announcements")({
  head: () => ({ meta: [{ title: "Announcements | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell adminOnly>
      <AnnouncementsAdmin />
    </PortalShell>
  ),
});
