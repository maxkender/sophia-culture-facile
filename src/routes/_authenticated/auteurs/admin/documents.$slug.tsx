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
  const valid = ["guide", "contract", "creator-agreement", "creator-guide", "creator-rules", "slideshow-guide"].includes(slug);
  return (
    <PortalShell adminOnly>
      {valid ? (
        <>
          {slug === "creator-agreement" ? (
            <div className="mb-6">
              <Banner tone="warning" title="This agreement has not been reviewed by a lawyer. Clause 5 on image rights and clause 12 on jurisdiction are the ones most worth checking." />
            </div>
          ) : null}
          <DocumentEditor slug={slug as DocumentSlug} />
        </>
      ) : (
        <Banner tone="error" title="Unknown document" />
      )}
    </PortalShell>
  );
}
