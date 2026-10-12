import { createFileRoute } from "@tanstack/react-router";
import { AppsCodesPage } from "@/components/creators/app/AppsCodesPage";

export const Route = createFileRoute("/creators/app/apps")({
  head: () => ({ meta: [
    { title: "My apps & codes | Sophia creator space" },
    { name: "description", content: "Your app access codes in the private Sophia creator space." },
    { property: "og:title", content: "My apps & codes | Sophia creator space" },
    { property: "og:description", content: "Private Sophia creator space." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AppsCodesPage,
});
