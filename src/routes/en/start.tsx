import { createFileRoute } from "@tanstack/react-router";
import { StartFunnel } from "@/components/onboarding/StartFunnel";

export const Route = createFileRoute("/en/start")({
  head: () => ({
    meta: [
      { title: "Your general knowledge plan | Sophia" },
      { name: "description", content: "Answer a few questions and get your personalised 30-day Sophia plan." },
      { property: "og:title", content: "Your general knowledge plan | Sophia" },
      { property: "og:description", content: "A few questions, a mini quiz and your 30-day plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <StartFunnel lang="en" />,
});
