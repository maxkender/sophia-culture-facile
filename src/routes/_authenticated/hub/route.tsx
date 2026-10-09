import { createFileRoute, Outlet } from "@tanstack/react-router";
import { HubShell } from "@/components/hub/HubShell";

export const Route = createFileRoute("/_authenticated/hub")({
  head: () => ({ meta: [{ title: "Creator Hub | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <HubShell>
      <Outlet />
    </HubShell>
  ),
});
