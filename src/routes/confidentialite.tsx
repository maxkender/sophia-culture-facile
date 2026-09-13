import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: meta({
      title: "Politique de confidentialité | Sophia, culture générale",
      description:
        "Politique de confidentialité de Sophia, culture générale, application mobile d'apprentissage éditée par Vik Studios SAS.",
      lang: "fr",
      key: "privacy",
    }),
    links: langLinks("privacy", "fr"),
  }),
  component: PrivacyPage,
});
