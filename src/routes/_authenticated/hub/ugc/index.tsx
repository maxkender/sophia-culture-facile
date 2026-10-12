import { createFileRoute } from "@tanstack/react-router";
import { UgcHome } from "@/components/hub/UgcHome";

export const Route = createFileRoute("/_authenticated/hub/ugc/")({
  head: () => ({ meta: [{ title: "UGC home | Sophia Hub" }, { name: "description", content: "Inspirations to review, briefs published, posts to validate." }, { property: "og:title", content: "UGC home | Sophia Hub" }, { property: "og:description", content: "Inspirations to review, briefs published, posts to validate." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: UgcHome,
});
