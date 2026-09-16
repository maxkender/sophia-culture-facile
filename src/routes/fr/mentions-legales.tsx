import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/pages/LegalPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/mentions-legales")({
  head: () => ({
    meta: meta({
      title: "Mentions légales | Sophia, culture générale",
      description:
        "Mentions légales du site de Sophia, culture générale, application mobile éditée par Vik Studios SAS, France.",
      lang: "fr",
      key: "legal",
    }),
    links: langLinks("legal", "fr"),
  }),
  component: LegalPage,
});
