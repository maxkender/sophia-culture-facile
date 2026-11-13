import { absUrl } from "@/config/site";
import { SLIDESHOW_LANGUAGES, fillSlideshow, findSlideshowLanguage, slideshowPath, slideshowStrings } from "@/i18n/slideshow-pages";
import { getSlideshowPayInfo } from "@/lib/slideshow-zones.functions";

export type PayRange = { min: number; max: number } | null;

/** Overall pay range for the meta description (DB-backed; falls back like the page does). */
export const loadSlideshowRange = (): Promise<PayRange> =>
  getSlideshowPayInfo({ data: {} }).then((r) => r.range).catch(() => null);

/** Head of a slideshow landing/form page in one language, with canonical and 30 hreflang alternates. */
export function slideshowHead(urlCode: string, page: "landing" | "apply", range: PayRange | undefined) {
  const lang = findSlideshowLanguage(urlCode) ?? findSlideshowLanguage("en");
  if (!lang) throw new Error("Missing English slideshow language");
  const s = slideshowStrings(lang.code);
  const vars = { name: "Vik Studios", min: range?.min ?? 7, max: range?.max ?? 14 };
  const title = fillSlideshow(page === "landing" ? s.landing.pageTitle : s.apply.pageTitle, vars);
  const description = fillSlideshow(s.landing.metaDescription, vars);
  const url = absUrl(slideshowPath(lang.urlCode, page));
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: url },
      ...SLIDESHOW_LANGUAGES.map((l) => ({ rel: "alternate", hrefLang: l.htmlLang, href: absUrl(slideshowPath(l.urlCode, page)) })),
      { rel: "alternate", hrefLang: "x-default", href: absUrl(slideshowPath("en", page)) },
    ],
  };
}
