import { createFileRoute } from "@tanstack/react-router";
import { JobsPage } from "@/components/creators/app/HubPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/jobs")({
  head: () => ({ meta: [
    { title: "Jobs | Sophia creator space" },
    { name: "description", content: "Jobs in the private Sophia creator space." },
    { property: "og:title", content: "Jobs | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Locked gate="steps"><JobsPage /></Locked>,
});
