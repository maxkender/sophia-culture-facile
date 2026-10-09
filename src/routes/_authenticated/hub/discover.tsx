import { createFileRoute } from "@tanstack/react-router";
import { Discover } from "@/components/hub/Discover";
import { AccountPool } from "@/components/hub/AccountPool";

export const Route = createFileRoute("/_authenticated/hub/discover")({
  head: () => ({ meta: [{ title: "Discover | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; add?: number | undefined } => ({ q: typeof s["q"] === "string" ? s["q"].slice(0, 120) : undefined, add: s["add"] ? 1 : undefined }),
  component: function DiscoverRoute() { const { q, add } = Route.useSearch(); return <div className="space-y-5"><AccountPool /><Discover key={`${q ?? ""}-${add ?? 0}`} initialQ={q} initialAdd={Boolean(add)} /></div>; },
});
