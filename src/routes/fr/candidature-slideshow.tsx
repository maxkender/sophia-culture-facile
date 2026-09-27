import { createFileRoute } from "@tanstack/react-router";
import { SlideshowApplyPage } from "@/components/creators/SlideshowApplyPage";

export const Route = createFileRoute("/fr/candidature-slideshow")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Postuler comme créateur de slideshows | Sophia" },
      { name: "description", content: "Formulaire de candidature pour publier des slideshows pour Sophia." },
      { property: "og:title", content: "Postuler comme créateur de slideshows | Sophia" },
      { property: "og:description", content: "Candidatez pour publier des slideshows pour Sophia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SlideshowApplyPage,
});