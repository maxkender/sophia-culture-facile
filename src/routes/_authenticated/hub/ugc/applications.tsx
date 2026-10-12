import { createFileRoute } from "@tanstack/react-router";
import { UgcCreatorsPage } from "@/components/hub/UgcCreatorsList";

export const Route = createFileRoute("/_authenticated/hub/ugc/applications")({
  head: () => ({ meta: [{ title: "UGC Applications | Sophia Hub" }, { name: "description", content: "Pending Sophia UGC applications to accept or reject." }, { property: "og:title", content: "UGC Applications | Sophia Hub" }, { property: "og:description", content: "Pending Sophia UGC applications." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: function ApplicationsRoute() { return <UgcCreatorsPage view="applications" />; },
});
