import { createFileRoute } from "@tanstack/react-router";
import { SlideshowApplyPage } from "@/components/creators/SlideshowApplyPage";
import { loadSlideshowRange, slideshowHead } from "@/lib/slideshow-seo";

export const Route = createFileRoute("/en/slideshow-application")({
  ssr: false,
  loader: () => loadSlideshowRange(),
  head: ({ loaderData }) => slideshowHead("en", "apply", loaderData),
  component: SlideshowApplyPage,
});
