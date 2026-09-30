import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AppsSettings } from "@/components/portal/admin/AppsSettings";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/apps")({
  head: () => ({ meta: [{ title: "Apps | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <PortalShell adminOnly><AppsSettings /></PortalShell>,
});
