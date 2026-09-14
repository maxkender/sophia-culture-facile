import { createFileRoute } from "@tanstack/react-router";
import { ApplyPage } from "@/components/pages/ApplyPage";
import { fr } from "@/i18n/fr";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/devenir-professeur")({
  ssr: false,
  head: () => ({
    meta: meta({
      title: fr.apply.metaTitle,
      description: fr.apply.metaDescription,
      lang: "fr",
      key: "apply",
    }),
    links: langLinks("apply", "fr"),
  }),
  component: ApplyPage,
});
