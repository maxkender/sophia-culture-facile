import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/pages/LegalPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/legal-notice")({
  head: () => ({
    meta: meta({
      title: "Legal notice | Sophia: General Knowledge",
      description:
        "Legal notice for the Sophia: General Knowledge website, a mobile learning app published by Vik Studios SAS, France.",
      lang: "en",
      key: "legal",
    }),
    links: langLinks("legal", "en"),
  }),
  component: LegalPage,
});
