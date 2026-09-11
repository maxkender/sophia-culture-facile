import { createFileRoute } from "@tanstack/react-router";
import { DownloadPage } from "@/components/pages/DownloadPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/telecharger")({
  head: () => ({
    meta: meta({
      title: "Télécharger Sophia — Culture générale (iOS et Android)",
      description:
        "Télécharge Sophia — Culture générale gratuitement sur l'App Store ou Google Play. L'application française de culture générale : cours courts, quiz et entraînement quotidien.",
      lang: "fr",
      key: "download",
    }),
    links: langLinks("download", "fr"),
  }),
  component: DownloadPage,
});
