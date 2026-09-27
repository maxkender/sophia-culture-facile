import { createFileRoute } from "@tanstack/react-router";
import { CreatorsChooserPage } from "@/components/pages/CreatorsPages";
import { CREATORS } from "@/i18n/creators";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/creators/")({
  head: () => ({
    meta: meta({
      title: CREATORS.en.chooser.metaTitle,
      description: CREATORS.en.chooser.metaDescription,
      lang: "en",
      key: "creators",
    }),
    links: langLinks("creators", "en"),
  }),
  component: CreatorsChooserPage,
});
