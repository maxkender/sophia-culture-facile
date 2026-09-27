import { createFileRoute } from "@tanstack/react-router";
import { CareersPage } from "@/components/pages/CareersPage";
import { fr } from "@/i18n/fr";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/careers")({
  head: () => ({
    meta: meta({
      title: fr.careers.metaTitle,
      description: fr.careers.metaDescription,
      lang: "fr",
      key: "careers",
    }),
    links: langLinks("careers", "fr"),
  }),
  component: CareersPage,
});
