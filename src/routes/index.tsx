import { createFileRoute } from "@tanstack/react-router";
import { HomeLanding } from "@/components/site/HomeLanding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vik Studios — apps people love" },
      { name: "description", content: "Vik Studios makes Sophia, the general-knowledge app, and works with creators all over the world." },
      { property: "og:title", content: "Vik Studios — apps people love" },
      { property: "og:description", content: "Vik Studios makes Sophia, the general-knowledge app, and works with creators all over the world." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <HomeLanding lang="en" />,
});
