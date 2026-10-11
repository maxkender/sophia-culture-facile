import { createFileRoute } from "@tanstack/react-router";
import { UgcEarnPage } from "@/components/pages/UgcEarnPage";

export const Route = createFileRoute("/en/creators/unswipe/ugc")({
  head: () => ({
    meta: [
      { title: "UGC creators · UnSwipe" },
      { name: "description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:title", content: "UGC creators · UnSwipe" },
      { property: "og:description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <UgcEarnPage app="unswipe" />,
});
