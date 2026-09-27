import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/creators/app/WorkPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/library")({
  head: () => ({ meta: [
    { title: "Library | Sophia creator space" },
    { name: "description", content: "Library in the private Sophia creator space." },
    { property: "og:title", content: "Library | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Locked gate="steps"><LibraryPage /></Locked>,
});
