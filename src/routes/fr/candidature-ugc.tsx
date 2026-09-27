import { createFileRoute } from "@tanstack/react-router";
import { UgcApplyPage } from "@/components/creators/UgcApplyPage";

export const Route = createFileRoute("/fr/candidature-ugc")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Postuler comme créateur UGC | Sophia" },
      { name: "description", content: "Formulaire de candidature pour devenir créateur UGC pour Sophia, l’application de culture générale." },
      { property: "og:title", content: "Postuler comme créateur UGC | Sophia" },
      { property: "og:description", content: "Candidatez pour créer des vidéos UGC pour Sophia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: UgcApplyPage,
});