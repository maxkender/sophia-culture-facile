import { createFileRoute } from "@tanstack/react-router";
import { HomeLanding, homeLandingHead } from "@/components/site/HomeLanding";

export const Route = createFileRoute("/en/")({
  head: () => homeLandingHead("en"),
  component: () => <HomeLanding lang="en" />,
});
