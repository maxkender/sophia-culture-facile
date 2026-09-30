import { createFileRoute } from "@tanstack/react-router";
import { InfluencerBriefs } from "@/components/influencers/InfluencerDealPages";

export const Route = createFileRoute("/creators/influencer/app/briefs")({
  head: () => ({ meta: [
    { title: "Briefs | Sophia influencer space" },
    { name: "description", content: "Briefs in the private Sophia influencer space." },
    { property: "og:title", content: "Briefs | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerBriefs />,
});
