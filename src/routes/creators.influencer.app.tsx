import { createFileRoute } from "@tanstack/react-router";
import { InfluencerSpace } from "@/components/influencers/InfluencerSpace";

export const Route = createFileRoute("/creators/influencer/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Influencer space | Sophia" },
      { name: "description", content: "Private workspace for Sophia influencers: offers, deals and payouts." },
      { property: "og:title", content: "Influencer space | Sophia" },
      { property: "og:description", content: "Private workspace for Sophia influencers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InfluencerSpace,
});
