import { createFileRoute } from "@tanstack/react-router";
import { Discover } from "@/components/hub/Discover";
import { AccountPool } from "@/components/hub/AccountPool";

export const Route = createFileRoute("/_authenticated/hub/discover")({
  head: () => ({ meta: [{ title: "Discover | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? s["q"].slice(0, 120) : undefined }),
  component: function DiscoverRoute() { const { q } = Route.useSearch(); return <div className="space-y-5"><AccountPool /><Discover key={q ?? ""} initialQ={q} /></div>; },
});
