import { createFileRoute } from "@tanstack/react-router";
import { Learn } from "@/components/hub/Learn";

export const Route = createFileRoute("/_authenticated/hub/ugc/library")({
  head: () => ({ meta: [{ title: "Library | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined; sub?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined, sub: typeof s["sub"] === "string" ? s["sub"] : undefined }),
  component: function R() { const { tab, sub } = Route.useSearch(); return <Learn key={`${tab}-${sub}`} initialTab={tab} sub={sub} />; },
});
