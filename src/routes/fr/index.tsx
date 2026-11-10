import { createFileRoute } from "@tanstack/react-router";
import { HomeLanding, homeLandingHead } from "@/components/site/HomeLanding";

export const Route = createFileRoute("/fr/")({
  head: () => homeLandingHead("fr"),
  component: () => <HomeLanding lang="fr" />,
});
