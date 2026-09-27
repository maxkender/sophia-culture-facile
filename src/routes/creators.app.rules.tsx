import { createFileRoute } from "@tanstack/react-router";
import { RulesPage } from "@/components/creators/app/ResourcePages";

export const Route = createFileRoute("/creators/app/rules")({
  head: () => ({ meta: [
    { title: "Rules | Sophia creator space" },
    { name: "description", content: "Rules in the private Sophia creator space." },
    { property: "og:title", content: "Rules | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <RulesPage />,
});
