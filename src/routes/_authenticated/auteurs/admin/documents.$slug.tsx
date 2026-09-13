import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { DocumentEditor } from "@/components/portal/admin/DocumentEditor";
import { Banner } from "@/components/portal/ui";
import type { DocumentSlug } from "@/lib/documents";

export const Route = createFileRoute("/_authenticated/auteurs/admin/documents/$slug")({
  head: () => ({ meta: [{ title: "Edit document | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DocumentEditorRoute,
});

function DocumentEditorRoute() {
  const { slug } = Route.useParams();
  const valid = slug === "guide" || slug === "contract";
  return (
    <PortalShell adminOnly>
      {valid ? (
        <DocumentEditor slug={slug as DocumentSlug} />
      ) : (
        <Banner tone="error" title="Unknown document" />
      )}
    </PortalShell>
  );
}
