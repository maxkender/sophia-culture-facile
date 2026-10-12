import { createFileRoute } from "@tanstack/react-router";
import { UgcPosts } from "@/components/hub/UgcPosts";

export const Route = createFileRoute("/_authenticated/hub/ugc/posts")({
  head: () => ({ meta: [{ title: "Posts | Sophia Hub" }, { name: "description", content: "Validate creator posts and follow them to payment." }, { property: "og:title", content: "Posts | Sophia Hub" }, { property: "og:description", content: "Validate creator posts and follow them to payment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: UgcPosts,
});
