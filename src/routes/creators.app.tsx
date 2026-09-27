import { createFileRoute } from "@tanstack/react-router";
import { CreatorSpace } from "@/components/creators/CreatorSpace";

export const Route = createFileRoute("/creators/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Creator space | Sophia" },
      { name: "description", content: "Private workspace for Sophia creators: briefs, posts and calls." },
      { property: "og:title", content: "Creator space | Sophia" },
      { property: "og:description", content: "Private workspace for Sophia creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CreatorSpace,
});
