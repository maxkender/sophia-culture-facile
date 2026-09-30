import { createFileRoute } from "@tanstack/react-router";
import { InfluencerDeals } from "@/components/influencers/InfluencerDealPages";

export const Route = createFileRoute("/creators/influencer/app/deals/")({
  head: () => ({ meta: [
    { title: "Deals | Sophia influencer space" },
    { name: "description", content: "Deals in the private Sophia influencer space." },
    { property: "og:title", content: "Deals | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerDeals />,
});
