import { createFileRoute } from "@tanstack/react-router";
import { CreatorsChooserPage } from "@/components/pages/CreatorsPages";
import { CREATORS } from "@/i18n/creators";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/createurs/")({
  head: () => ({
    meta: meta({
      title: CREATORS.fr.chooser.metaTitle,
      description: CREATORS.fr.chooser.metaDescription,
      lang: "fr",
      key: "creators",
    }),
    links: langLinks("creators", "fr"),
  }),
  component: CreatorsChooserPage,
});
