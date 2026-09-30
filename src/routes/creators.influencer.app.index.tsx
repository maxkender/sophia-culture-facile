import { createFileRoute } from "@tanstack/react-router";
import { InfluencerHome } from "@/components/influencers/InfluencerPages";

export const Route = createFileRoute("/creators/influencer/app/")({
  head: () => ({ meta: [
    { title: "Home | Sophia influencer space" },
    { name: "description", content: "Home in the private Sophia influencer space." },
    { property: "og:title", content: "Home | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerHome />,
});
