import { createFileRoute } from "@tanstack/react-router";
import { BriefDetailPage } from "@/components/creators/app/WorkPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/briefs/$briefId")({
  head: () => ({ meta: [
    { title: "Brief | Sophia creator space" },
    { name: "description", content: "Brief in the private Sophia creator space." },
    { property: "og:title", content: "Brief | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: function BriefRoute() {
    const { briefId } = Route.useParams();
    return <Locked gate="steps"><BriefDetailPage briefId={briefId} /></Locked>;
  },
});
