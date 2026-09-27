import { createFileRoute } from "@tanstack/react-router";
import { CallsPage } from "@/components/creators/app/WorkPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/calls")({
  head: () => ({ meta: [
    { title: "Calls | Sophia creator space" },
    { name: "description", content: "Calls in the private Sophia creator space." },
    { property: "og:title", content: "Calls | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Locked gate="steps"><CallsPage /></Locked>,
});
