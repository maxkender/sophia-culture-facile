import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { AuthorMessages } from "@/components/portal/AuthorMessages";

type Search = { course?: string };

export const Route = createFileRoute("/_authenticated/auteurs/messages")({
  head: () => ({ meta: [{ title: "Messages | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    course: typeof search.course === "string" ? search.course : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { course } = Route.useSearch();
  return (
    <PortalShell>
      <AuthorMessages courseId={course} />
    </PortalShell>
  );
}
