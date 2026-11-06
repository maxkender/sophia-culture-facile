import { createFileRoute } from "@tanstack/react-router";
import { SlideshowApplyPage } from "@/components/creators/SlideshowApplyPage";
import { loadSlideshowRange, slideshowHead } from "@/lib/slideshow-seo";

export const Route = createFileRoute("/fr/candidature-slideshow")({
  ssr: false,
  loader: () => loadSlideshowRange(),
  head: ({ loaderData }) => slideshowHead("fr", "apply", loaderData),
  component: SlideshowApplyPage,
});
