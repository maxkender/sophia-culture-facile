import { createFileRoute } from "@tanstack/react-router";
import { InfluencerEarnings } from "@/components/influencers/InfluencerDealPages";

export const Route = createFileRoute("/creators/influencer/app/earnings")({
  head: () => ({ meta: [
    { title: "Earnings | Sophia influencer space" },
    { name: "description", content: "Earnings in the private Sophia influencer space." },
    { property: "og:title", content: "Earnings | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerEarnings />,
});
