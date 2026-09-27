import { createFileRoute } from "@tanstack/react-router";
import { SlideshowLandingPage } from "@/components/pages/CreatorsPages";
import { CREATORS } from "@/i18n/creators";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/fr/createurs/slideshow")({
  head: () => ({
    meta: meta({
      title: CREATORS.fr.slideshow.metaTitle,
      description: CREATORS.fr.slideshow.metaDescription,
      lang: "fr",
      key: "creatorsSlideshow",
    }),
    links: langLinks("creatorsSlideshow", "fr"),
  }),
  component: SlideshowLandingPage,
});
