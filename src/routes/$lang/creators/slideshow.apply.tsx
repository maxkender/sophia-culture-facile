import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { SlideshowApplyPage } from "@/components/creators/SlideshowApplyPage";
import { findSlideshowLanguage, slideshowPath } from "@/i18n/slideshow-pages";
import { loadSlideshowRange, slideshowHead } from "@/lib/slideshow-seo";

/** /{urlCode}/creators/slideshow/apply for the 28 other languages; EN/FR go to their historic URLs. */
export const Route = createFileRoute("/$lang/creators/slideshow/apply")({
  ssr: false,
  beforeLoad: ({ params, location }) => {
    const lang = findSlideshowLanguage(params.lang);
    if (!lang) throw notFound();
    if (lang.urlCode === "en" || lang.urlCode === "fr") {
      throw redirect({ href: slideshowPath(lang.urlCode, "apply") + (location.searchStr ?? ""), replace: true });
    }
  },
  loader: () => loadSlideshowRange(),
  head: ({ params, loaderData }) => slideshowHead(params.lang, "apply", loaderData),
  component: SlideshowApplyPage,
});
