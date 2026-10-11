import { createFileRoute, redirect } from "@tanstack/react-router";
import { InfluencersHome } from "@/components/hub/Sections";

const OLD: Record<string, string> = { performance: "attribution", agreement: "settings" };

export const Route = createFileRoute("/_authenticated/hub/influencers/")({
  head: () => ({ meta: [{ title: "Influencers | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined; id?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined, id: typeof s["id"] === "string" ? s["id"] : undefined }),
  beforeLoad: ({ search }) => {
    if (search.tab) throw redirect({ to: "/hub/influencers/$section", params: { section: OLD[search.tab] ?? search.tab }, search: search.id ? { id: search.id } : {}, replace: true, statusCode: 301 } as never);
  },
  component: InfluencersHome,
});
