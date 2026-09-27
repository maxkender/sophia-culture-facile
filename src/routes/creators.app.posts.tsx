import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PostsPage } from "@/components/creators/app/WorkPages";
import { Locked } from "@/components/creators/app/CreatorShell";

export const Route = createFileRoute("/creators/app/posts")({
  validateSearch: (s) => z.object({ ref: z.string().uuid().optional() }).parse(s),
  head: () => ({ meta: [
    { title: "My posts | Sophia creator space" },
    { name: "description", content: "My posts in the private Sophia creator space." },
    { property: "og:title", content: "My posts | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: function PostsRoute() {
    const { ref } = Route.useSearch();
    return <Locked gate="steps"><PostsPage refId={ref} /></Locked>;
  },
});
