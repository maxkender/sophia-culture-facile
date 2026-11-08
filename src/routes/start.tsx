import { createFileRoute } from "@tanstack/react-router";
import { StartFunnel } from "@/components/onboarding/StartFunnel";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Ton programme de culture générale | Sophia" },
      { name: "description", content: "Réponds à quelques questions et reçois ton programme Sophia personnalisé sur 30 jours." },
      { property: "og:title", content: "Ton programme de culture générale | Sophia" },
      { property: "og:description", content: "Quelques questions, un mini quiz et ton plan sur 30 jours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <StartFunnel lang="fr" />,
});
