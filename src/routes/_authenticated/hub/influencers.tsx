import { createFileRoute } from "@tanstack/react-router";
import { Influencers } from "@/components/hub/Sections";

export const Route = createFileRoute("/_authenticated/hub/influencers")({
  head: () => ({ meta: [{ title: "Influencers | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined; id?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined, id: typeof s["id"] === "string" ? s["id"] : undefined }),
  component: function R() { const { tab, id } = Route.useSearch(); return <Influencers key={`${tab}-${id}`} tab={tab} id={id} />; },
});
