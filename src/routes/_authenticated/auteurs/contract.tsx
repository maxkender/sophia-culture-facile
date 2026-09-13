import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorAgreement } from "@/components/portal/AuthorAgreement";

export const Route = createFileRoute("/_authenticated/auteurs/contract")({
  head: () => ({ meta: [{ title: "Author agreement | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <PortalShell>
      <AuthorAgreement />
    </PortalShell>
  ),
});
