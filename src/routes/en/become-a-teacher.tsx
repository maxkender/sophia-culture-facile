import { createFileRoute } from "@tanstack/react-router";
import { ApplyPage } from "@/components/pages/ApplyPage";
import { en } from "@/i18n/en";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/become-a-teacher")({
  ssr: false,
  head: () => ({
    meta: meta({
      title: en.apply.metaTitle,
      description: en.apply.metaDescription,
      lang: "en",
      key: "apply",
    }),
    links: langLinks("apply", "en"),
  }),
  component: ApplyPage,
});
