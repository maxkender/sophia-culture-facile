import { createFileRoute } from "@tanstack/react-router";
import { BriefStudio } from "@/components/hub/BriefStudio";

export const Route = createFileRoute("/_authenticated/hub/ugc/briefs/$briefId")({
  head: () => ({ meta: [
    { title: "Brief editor | Sophia Hub" },
    { name: "description", content: "Write, preview and publish a creator brief." },
    { property: "og:title", content: "Brief editor | Sophia Hub" },
    { property: "og:description", content: "Write, preview and publish a creator brief." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: function StudioRoute() {
    const { briefId } = Route.useParams();
    return <BriefStudio key={briefId} briefId={briefId} />;
  },
});
