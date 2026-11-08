import { createFileRoute } from "@tanstack/react-router";
import { StartFunnel } from "@/components/onboarding/StartFunnel";

export const Route = createFileRoute("/en/start")({
  head: () => ({
    meta: [
      { title: "Welcome to Sophia" },
      { name: "description", content: "Get a little smarter every day." },
      { property: "og:title", content: "Welcome to Sophia" },
      { property: "og:description", content: "Get a little smarter every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <StartFunnel lang="en" />,
});
