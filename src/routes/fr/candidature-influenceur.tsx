import { createFileRoute } from "@tanstack/react-router";
import { InfluencerApplyPage } from "@/components/creators/InfluencerApplyPage";

export const Route = createFileRoute("/fr/candidature-influenceur")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Postuler comme influenceur | Sophia" },
      { name: "description", content: "Formulaire de candidature pour devenir partenaire influenceur de Sophia." },
      { property: "og:title", content: "Postuler comme influenceur | Sophia" },
      { property: "og:description", content: "Formulaire de candidature pour devenir partenaire influenceur de Sophia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: InfluencerApplyPage,
});
