import { createFileRoute } from "@tanstack/react-router";
import { ContributionDashboard } from "@/components/teacher/ContributionDashboard";

export const Route = createFileRoute("/_authenticated/espace-professeur")({
  head: () => ({ meta: [{ title: "Espace professeur | Sophia" }, { name: "description", content: "Sujets, contributions et validations Sophia." }, { property: "og:title", content: "Espace professeur | Sophia" }, { property: "og:description", content: "Sujets, contributions et validations Sophia." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ContributionDashboard,
});