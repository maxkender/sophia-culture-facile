import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorHome } from "@/components/portal/AuthorHome";
import { AdminDashboard } from "@/components/portal/admin/AdminDashboard";
import { usePortalProfile } from "@/components/portal/usePortal";

function PortalIndex() {
  const { data } = usePortalProfile();
  return <PortalShell>{data?.profile?.role === "admin" ? <AdminDashboard /> : <AuthorHome />}</PortalShell>;
}

export const Route = createFileRoute("/_authenticated/auteurs/")({
  head: () => ({ meta: [{ title: "Author portal | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PortalIndex,
});
