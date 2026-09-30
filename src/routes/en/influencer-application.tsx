import { createFileRoute } from "@tanstack/react-router";
import { InfluencerApplyPage } from "@/components/creators/InfluencerApplyPage";

export const Route = createFileRoute("/en/influencer-application")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply as an influencer | Sophia" },
      { name: "description", content: "Application form to partner with Sophia as an influencer." },
      { property: "og:title", content: "Apply as an influencer | Sophia" },
      { property: "og:description", content: "Application form to partner with Sophia as an influencer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: InfluencerApplyPage,
});
