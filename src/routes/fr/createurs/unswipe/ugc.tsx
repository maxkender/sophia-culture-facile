import { createFileRoute } from "@tanstack/react-router";
import { UgcLandingPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/fr/createurs/unswipe/ugc")({
  head: () => ({
    meta: [
      { title: "Créateurs UGC · UnSwipe" },
      { name: "description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:title", content: "Créateurs UGC · UnSwipe" },
      { property: "og:description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <UgcLandingPage app="unswipe" />,
});
