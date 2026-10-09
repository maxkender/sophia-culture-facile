import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/creators/app/HubPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/tasks")({
  head: () => ({ meta: [
    { title: "Tasks | Sophia creator space" },
    { name: "description", content: "Tasks in the private Sophia creator space." },
    { property: "og:title", content: "Tasks | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <Locked gate="steps"><TasksPage /></Locked>,
});
