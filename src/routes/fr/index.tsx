import { createFileRoute } from "@tanstack/react-router";
import { HomeLanding } from "@/components/site/HomeLanding";

export const Route = createFileRoute("/fr/")({
  head: () => ({
    meta: [
      { title: "Vik Studios — des apps qu'on adore" },
      { name: "description", content: "Vik Studios fait Sophia, l'app de culture générale, et travaille avec des créateurs du monde entier." },
      { property: "og:title", content: "Vik Studios — des apps qu'on adore" },
      { property: "og:description", content: "Vik Studios fait Sophia, l'app de culture générale, et travaille avec des créateurs du monde entier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <HomeLanding lang="fr" />,
});
