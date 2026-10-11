import { createFileRoute } from "@tanstack/react-router";
import { InfluencerSection } from "@/components/hub/Sections";

export const Route = createFileRoute("/_authenticated/hub/influencers/$section")({
  head: () => ({ meta: [{ title: "Influencers | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  component: function R() { const { section } = Route.useParams(); const { id } = Route.useSearch(); return <InfluencerSection key={`${section}-${id}`} section={section} id={id} />; },
});
