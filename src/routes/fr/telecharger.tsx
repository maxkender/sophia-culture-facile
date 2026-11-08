import { createFileRoute } from "@tanstack/react-router";
import { MarketingDownload } from "@/components/marketing/pages";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/telecharger")({
  head: () => ({
    meta: meta({
      title: "Télécharger Sophia, culture générale (iOS et Android)",
      description:
        "Télécharge Sophia, culture générale gratuitement sur l'App Store ou Google Play. L'application française de culture générale : cours courts, quiz et entraînement quotidien.",
      lang: "fr",
      key: "download",
    }),
    links: langLinks("download", "fr"),
  }),
  component: MarketingDownload,
});
