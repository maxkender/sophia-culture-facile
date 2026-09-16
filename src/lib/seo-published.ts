/** Métadonnées des pages alimentées par la base : cours publiés et auteurs. */

import { absUrl, OG_IMAGE_URL } from "@/config/site";
import { subjectLabel } from "@/config/subjects";
import { authorPath, coursePath, type Lang } from "@/i18n/routes";
import { ldScript } from "@/lib/seo";
import type { PublicAuthor, PublicCourse, PublicCourseCard } from "@/lib/public-content.functions";

export function publishedCourseHead(course: PublicCourse) {
  const lang = course.language;
  const url = absUrl(coursePath(lang, course.slug));
  const description =
    course.subtitle ||
    (course.screens[0]?.body ?? "").replace(/\*\*/g, "").slice(0, 155) ||
    course.title;
  const image = course.author?.photo_url ?? OG_IMAGE_URL;
  const other: Lang = lang === "fr" ? "en" : "fr";
  const alternateUrl = course.alternate_slug ? absUrl(coursePath(other, course.alternate_slug)) : null;

  return {
    meta: [
      { title: `${course.title} | Sophia` },
      { name: "description", content: description.slice(0, 160) },
      { property: "og:title", content: course.title },
      { property: "og:description", content: description.slice(0, 160) },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:locale", content: lang === "fr" ? "fr_FR" : "en_US" },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: image },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: lang, href: url },
      ...(alternateUrl
        ? [
            { rel: "alternate", hrefLang: other, href: alternateUrl },
            { rel: "alternate", hrefLang: "x-default", href: lang === "en" ? url : alternateUrl },
          ]
        : []),
    ],
    scripts: [
      ldScript({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: course.title,
        description: description.slice(0, 160),
        url,
        image,
        inLanguage: lang,
        articleSection: subjectLabel(course.subject_area),
        ...(course.published_at ? { datePublished: course.published_at } : {}),
        ...(course.author
          ? {
              author: {
                "@type": "Person",
                name: course.author.display_name,
                ...(course.author.slug ? { url: absUrl(authorPath(lang, course.author.slug)) } : {}),
                ...(course.author.display_title ? { jobTitle: course.author.display_title } : {}),
              },
            }
          : {}),
        publisher: { "@type": "Organization", name: "Sophia", url: absUrl("/") },
      }),
    ],
  };
}

export function publishedAuthorHead(
  author: PublicAuthor,
  courses: PublicCourseCard[],
  lang: Lang,
  slug: string,
) {
  const title =
    lang === "fr" ? `${author.display_name} — auteur sur Sophia` : `${author.display_name} — Sophia author`;
  const fallback =
    lang === "fr"
      ? `Les cours de culture générale écrits par ${author.display_name} sur Sophia.`
      : `The general knowledge lessons written by ${author.display_name} on Sophia.`;
  const description =
    author.short_bio || [author.display_title, author.institution].filter(Boolean).join(". ") || fallback;
  const url = absUrl(authorPath(lang, slug));
  const other: Lang = lang === "fr" ? "en" : "fr";

  return {
    meta: [
      { title },
      { name: "description", content: description.slice(0, 160) },
      { property: "og:title", content: title },
      { property: "og:description", content: description.slice(0, 160) },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      ...(author.photo_url
        ? [
            { property: "og:image", content: author.photo_url },
            { name: "twitter:image", content: author.photo_url },
          ]
        : []),
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: lang, href: url },
      { rel: "alternate", hrefLang: other, href: absUrl(authorPath(other, slug)) },
      { rel: "alternate", hrefLang: "x-default", href: absUrl(authorPath("en", slug)) },
    ],
    scripts: [
      ldScript({
        "@context": "https://schema.org",
        "@type": "Person",
        name: author.display_name,
        url,
        ...(author.photo_url ? { image: author.photo_url } : {}),
        ...(author.display_title ? { jobTitle: author.display_title } : {}),
        ...(author.institution
          ? { affiliation: { "@type": "Organization", name: author.institution } }
          : {}),
        ...(author.short_bio ? { description: author.short_bio } : {}),
        sameAs: [author.orcid, author.personal_site, author.scholar_url].filter(Boolean),
        knowsAbout: [...new Set(courses.map((course) => course.subject_area).filter(Boolean))],
      }),
    ],
  };
}
