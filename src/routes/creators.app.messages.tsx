import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "@/components/creators/app/WorkPages";

export const Route = createFileRoute("/creators/app/messages")({
  head: () => ({ meta: [
    { title: "Messages | Sophia creator space" },
    { name: "description", content: "Messages in the private Sophia creator space." },
    { property: "og:title", content: "Messages | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <MessagesPage />,
});
