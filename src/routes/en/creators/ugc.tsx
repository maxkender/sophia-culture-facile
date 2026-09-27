import { createFileRoute } from "@tanstack/react-router";
import { UgcLandingPage } from "@/components/pages/CreatorsPages";
import { CREATORS } from "@/i18n/creators";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/creators/ugc")({
  head: () => ({
    meta: meta({
      title: CREATORS.en.ugc.metaTitle,
      description: CREATORS.en.ugc.metaDescription,
      lang: "en",
      key: "creatorsUgc",
    }),
    links: langLinks("creatorsUgc", "en"),
  }),
  component: UgcLandingPage,
});
