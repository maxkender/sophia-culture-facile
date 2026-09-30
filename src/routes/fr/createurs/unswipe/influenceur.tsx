import { createFileRoute } from "@tanstack/react-router";
import { InfluencerLandingPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/fr/createurs/unswipe/influenceur")({
  head: () => ({
    meta: [
      { title: "Influenceurs · UnSwipe" },
      { name: "description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:title", content: "Influenceurs · UnSwipe" },
      { property: "og:description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <InfluencerLandingPage app="unswipe" />,
});
