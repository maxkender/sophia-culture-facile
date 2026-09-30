import { createFileRoute } from "@tanstack/react-router";
import { SlideshowLandingPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/en/creators/unswipe/slideshow")({
  head: () => ({
    meta: [
      { title: "Slideshow creators · UnSwipe" },
      { name: "description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:title", content: "Slideshow creators · UnSwipe" },
      { property: "og:description", content: "Create content for UnSwipe, Instagram without the Reels, a Vik Studios app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <SlideshowLandingPage app="unswipe" />,
});
