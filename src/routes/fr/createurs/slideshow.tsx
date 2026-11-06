import { createFileRoute } from "@tanstack/react-router";
import { SlideshowLandingPage } from "@/components/pages/CreatorsPages";
import { loadSlideshowRange, slideshowHead } from "@/lib/slideshow-seo";

export const Route = createFileRoute("/fr/createurs/slideshow")({
  loader: () => loadSlideshowRange(),
  head: ({ loaderData }) => slideshowHead("fr", "landing", loaderData),
  component: SlideshowLandingPage,
});
