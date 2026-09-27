import { createFileRoute } from "@tanstack/react-router";
import { UgcApplyPage } from "@/components/creators/UgcApplyPage";

export const Route = createFileRoute("/creators/ugc/apply")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply as a UGC creator | Sophia" },
      { name: "description", content: "Application form to become a UGC creator for Sophia, the general-knowledge app." },
      { property: "og:title", content: "Apply as a UGC creator | Sophia" },
      { property: "og:description", content: "Application form to become a UGC creator for Sophia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: UgcApplyPage,
});
