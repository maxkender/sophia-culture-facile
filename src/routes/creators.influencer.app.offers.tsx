import { createFileRoute } from "@tanstack/react-router";
import { InfluencerOffers } from "@/components/influencers/InfluencerDealPages";

export const Route = createFileRoute("/creators/influencer/app/offers")({
  head: () => ({ meta: [
    { title: "Offers | Sophia influencer space" },
    { name: "description", content: "Offers in the private Sophia influencer space." },
    { property: "og:title", content: "Offers | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerOffers />,
});
