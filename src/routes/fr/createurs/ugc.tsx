import { createFileRoute } from "@tanstack/react-router";
import { UgcEarnPage } from "@/components/pages/UgcEarnPage";
import { CREATORS } from "@/i18n/creators";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/createurs/ugc")({
  head: () => ({
    meta: meta({
      title: CREATORS.fr.ugc.metaTitle,
      description: CREATORS.fr.ugc.metaDescription,
      lang: "fr",
      key: "creatorsUgc",
    }),
    links: langLinks("creatorsUgc", "fr"),
  }),
  component: UgcEarnPage,
});
