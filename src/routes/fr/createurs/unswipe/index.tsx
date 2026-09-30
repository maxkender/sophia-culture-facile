import { createFileRoute } from "@tanstack/react-router";
import { CreatorsChooserPage } from "@/components/pages/CreatorsPages";

export const Route = createFileRoute("/fr/createurs/unswipe/")({
  head: () => ({
    meta: [
      { title: "Créateurs · UnSwipe" },
      { name: "description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:title", content: "Créateurs · UnSwipe" },
      { property: "og:description", content: "Créez du contenu pour UnSwipe, Instagram sans les Reels, une app de Vik Studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <CreatorsChooserPage app="unswipe" />,
});
