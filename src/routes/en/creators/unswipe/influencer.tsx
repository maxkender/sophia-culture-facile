import { createFileRoute } from "@tanstack/react-router";
import { InfluencerLandingPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/en/creators/unswipe/influencer")({
  head: () => ({
    meta: [
      { title: "Influencers · UnSwipe" },
      { name: "description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:title", content: "Influencers · UnSwipe" },
      { property: "og:description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <InfluencerLandingPage app="unswipe" />,
});
