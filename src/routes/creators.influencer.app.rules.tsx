import { createFileRoute } from "@tanstack/react-router";
import { InfluencerRules } from "@/components/influencers/InfluencerPages";

export const Route = createFileRoute("/creators/influencer/app/rules")({
  head: () => ({ meta: [
    { title: "Rules | Sophia influencer space" },
    { name: "description", content: "Rules in the private Sophia influencer space." },
    { property: "og:title", content: "Rules | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerRules />,
});
