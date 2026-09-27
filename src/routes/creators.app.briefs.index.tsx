import { createFileRoute } from "@tanstack/react-router";
import { BriefsPage } from "@/components/creators/app/WorkPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/briefs/")({
  head: () => ({ meta: [
    { title: "Briefs | Sophia creator space" },
    { name: "description", content: "Briefs in the private Sophia creator space." },
    { property: "og:title", content: "Briefs | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Locked gate="steps"><BriefsPage /></Locked>,
});
