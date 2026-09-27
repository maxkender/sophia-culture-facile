import { createFileRoute } from "@tanstack/react-router";
import { CareersPage } from "@/components/pages/CareersPage";
import { en } from "@/i18n/en";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/careers")({
  head: () => ({
    meta: meta({
      title: en.careers.metaTitle,
      description: en.careers.metaDescription,
      lang: "en",
      key: "careers",
    }),
    links: langLinks("careers", "en"),
  }),
  component: CareersPage,
});
