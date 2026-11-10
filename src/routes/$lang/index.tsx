import { createFileRoute, notFound } from "@tanstack/react-router";
import { HomeLanding, homeLandingHead } from "@/components/site/HomeLanding";
import { findSlideshowLanguage } from "@/i18n/slideshow-pages";

/** Mini landing at /{urlCode} for every poster language (same list as the slideshow pages); /en and /fr have their own routes. */
export const Route = createFileRoute("/$lang/")({
  beforeLoad: ({ params }) => { if (!findSlideshowLanguage(params.lang)) throw notFound(); },
  head: ({ params }) => (findSlideshowLanguage(params.lang) ? homeLandingHead(params.lang) : { meta: [{ title: "Not found — Vik Studios" }, { name: "robots", content: "noindex" }] }),
  component: LangHome,
});

function LangHome() {
  const { lang } = Route.useParams();
  return <HomeLanding lang={lang} />;
}
