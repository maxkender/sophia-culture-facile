import { createFileRoute } from "@tanstack/react-router";
import { BriefsList } from "@/components/hub/BriefsList";

export const Route = createFileRoute("/_authenticated/hub/ugc/briefs/")({
  head: () => ({ meta: [{ title: "Briefs | Sophia Hub" }, { name: "description", content: "Your UGC briefs: drafts, published and archived." }, { property: "og:title", content: "Briefs | Sophia Hub" }, { property: "og:description", content: "Your UGC briefs: drafts, published and archived." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <BriefsList />,
});
