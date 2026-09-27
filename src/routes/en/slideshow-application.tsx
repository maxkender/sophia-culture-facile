import { createFileRoute } from "@tanstack/react-router";
import { SlideshowApplyPage } from "@/components/creators/SlideshowApplyPage";

export const Route = createFileRoute("/en/slideshow-application")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply as a slideshow creator | Sophia" },
      { name: "description", content: "Application form to become a slideshow creator for Sophia, the general-knowledge app." },
      { property: "og:title", content: "Apply as a slideshow creator | Sophia" },
      { property: "og:description", content: "Apply to publish slideshows for Sophia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SlideshowApplyPage,
});