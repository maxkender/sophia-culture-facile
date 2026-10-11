import { createFileRoute } from "@tanstack/react-router";
import { BriefStudio } from "@/components/hub/BriefStudio";

export const Route = createFileRoute("/_authenticated/hub/learn_/briefs/$briefId")({
  head: () => ({ meta: [
    { title: "Brief Studio | Creator Hub" },
    { name: "description", content: "Write, preview and publish a creator brief." },
    { property: "og:title", content: "Brief Studio | Creator Hub" },
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
