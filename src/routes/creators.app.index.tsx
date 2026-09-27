import { createFileRoute } from "@tanstack/react-router";
import { CreatorHomePage } from "@/components/creators/app/HomePage";

export const Route = createFileRoute("/creators/app/")({
  head: () => ({ meta: [
    { title: "Home | Sophia creator space" },
    { name: "description", content: "Home in the private Sophia creator space." },
    { property: "og:title", content: "Home | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <CreatorHomePage />,
});
