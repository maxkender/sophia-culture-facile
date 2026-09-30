import { createFileRoute } from "@tanstack/react-router";
import { InfluencerProfile } from "@/components/influencers/InfluencerPages";

export const Route = createFileRoute("/creators/influencer/app/profile")({
  head: () => ({ meta: [
    { title: "Profile | Sophia influencer space" },
    { name: "description", content: "Profile in the private Sophia influencer space." },
    { property: "og:title", content: "Profile | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerProfile />,
});
