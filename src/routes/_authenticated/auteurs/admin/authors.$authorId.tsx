import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorDetail } from "@/components/portal/admin/AuthorDetail";

function AuthorRoute() {
  const { authorId } = Route.useParams();
  return (
    <PortalShell adminOnly>
      <AuthorDetail authorId={authorId} />
    </PortalShell>
  );
}

export const Route = createFileRoute("/_authenticated/auteurs/admin/authors/$authorId")({
  head: () => ({ meta: [{ title: "Author | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AuthorRoute,
});
