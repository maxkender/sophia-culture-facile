import { createFileRoute } from "@tanstack/react-router";
import { InfluencerPayouts } from "@/components/influencers/InfluencerPages";

export const Route = createFileRoute("/creators/influencer/app/payouts")({
  head: () => ({ meta: [
    { title: "Payouts | Sophia influencer space" },
    { name: "description", content: "Payouts in the private Sophia influencer space." },
    { property: "og:title", content: "Payouts | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerPayouts />,
});
