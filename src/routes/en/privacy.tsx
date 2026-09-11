import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/privacy")({
  head: () => ({
    meta: meta({
      title: "Privacy policy | Sophia: General Knowledge",
      description:
        "How Vik Studios SAS handles personal data for the Sophia: General Knowledge app and website.",
      lang: "en",
      key: "privacy",
    }),
    links: langLinks("privacy", "en"),
  }),
  component: PrivacyPage,
});
