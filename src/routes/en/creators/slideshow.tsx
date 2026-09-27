import { createFileRoute } from "@tanstack/react-router";
import { SlideshowLandingPage } from "@/components/pages/CreatorsPages";
import { CREATORS } from "@/i18n/creators";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/creators/slideshow")({
  head: () => ({
    meta: meta({
      title: CREATORS.en.slideshow.metaTitle,
      description: CREATORS.en.slideshow.metaDescription,
      lang: "en",
      key: "creatorsSlideshow",
    }),
    links: langLinks("creatorsSlideshow", "en"),
  }),
  component: SlideshowLandingPage,
});
