import { createFileRoute } from "@tanstack/react-router";
import { CreatorsChooserPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/en/creators/unswipe/")({
  head: () => ({
    meta: [
      { title: "Creators · UnSwipe" },
      { name: "description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:title", content: "Creators · UnSwipe" },
      { property: "og:description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <CreatorsChooserPage app="unswipe" />,
});
