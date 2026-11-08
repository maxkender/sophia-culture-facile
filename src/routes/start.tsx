import { createFileRoute } from "@tanstack/react-router";
import { StartFunnel } from "@/components/onboarding/StartFunnel";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Bienvenue sur Sophia" },
      { name: "description", content: "Deviens plus cultivé, un peu chaque jour." },
      { property: "og:title", content: "Bienvenue sur Sophia" },
      { property: "og:description", content: "Deviens plus cultivé, un peu chaque jour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <StartFunnel lang="fr" />,
});
