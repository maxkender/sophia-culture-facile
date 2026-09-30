import { createFileRoute } from "@tanstack/react-router";
import { InfluencerAgreement } from "@/components/influencers/InfluencerPages";

export const Route = createFileRoute("/creators/influencer/app/agreement")({
  head: () => ({ meta: [
    { title: "Master agreement | Sophia influencer space" },
    { name: "description", content: "Master agreement in the private Sophia influencer space." },
    { property: "og:title", content: "Master agreement | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <InfluencerAgreement />,
});
