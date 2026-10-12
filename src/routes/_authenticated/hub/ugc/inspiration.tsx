import { createFileRoute } from "@tanstack/react-router";
import { Inspiration } from "@/components/hub/Inspiration";

export const Route = createFileRoute("/_authenticated/hub/ugc/inspiration")({
  head: () => ({ meta: [{ title: "Inspiration | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { open?: string | undefined; author?: string | undefined; tab?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined, open: typeof s["open"] === "string" ? s["open"] : undefined, author: typeof s["author"] === "string" ? s["author"] : undefined }),
  component: function R() { const { open, author, tab } = Route.useSearch(); return <Inspiration initialOpen={open} initialAuthor={author} initialTab={tab} />; },
});
