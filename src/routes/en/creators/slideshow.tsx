import { createFileRoute } from "@tanstack/react-router";
import { SlideshowLandingPage } from "@/components/pages/CreatorsPages";
import { loadSlideshowRange, slideshowHead } from "@/lib/slideshow-seo";

export const Route = createFileRoute("/en/creators/slideshow")({
  loader: () => loadSlideshowRange(),
  head: ({ loaderData }) => slideshowHead("en", "landing", loaderData),
  component: SlideshowLandingPage,
});
