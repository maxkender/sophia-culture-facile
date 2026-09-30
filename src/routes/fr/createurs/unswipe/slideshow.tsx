import { createFileRoute } from "@tanstack/react-router";
import { SlideshowLandingPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/fr/createurs/unswipe/slideshow")({
  head: () => ({
    meta: [
      { title: "Créateurs de slideshows · UnSwipe" },
      { name: "description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:title", content: "Créateurs de slideshows · UnSwipe" },
      { property: "og:description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <SlideshowLandingPage app="unswipe" />,
});
