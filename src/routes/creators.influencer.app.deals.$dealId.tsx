import { createFileRoute } from "@tanstack/react-router";
import { InfluencerDealPage } from "@/components/influencers/InfluencerDealPages";

export const Route = createFileRoute("/creators/influencer/app/deals/$dealId")({
  head: () => ({ meta: [
    { title: "Deal | Sophia influencer space" },
    { name: "description", content: "Deal in the private Sophia influencer space." },
    { property: "og:title", content: "Deal | Sophia influencer space" },
    { property: "og:description", content: "Private Sophia influencer space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: function Page() { const { dealId } = Route.useParams(); return <InfluencerDealPage dealId={dealId} />; },
});
