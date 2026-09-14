import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/PortalShell";
import { MessagesInbox } from "@/components/portal/admin/MessagesInbox";

type Search = { thread?: string | undefined };

export const Route = createFileRoute("/_authenticated/auteurs/admin/messages")({
  head: () => ({ meta: [{ title: "Messages | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (search: Record<string, unknown>): Search => ({
    thread: typeof search["thread"] === "string" ? (search["thread"] as string) : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { thread } = Route.useSearch();
  return (
    <PortalShell adminOnly>
      <MessagesInbox conversationId={thread} />
    </PortalShell>
  );
}
