import { createFileRoute } from "@tanstack/react-router";
import { getCourseSitemapEntries } from "@/content/api";
import { absUrl } from "@/config/site";
import { ROUTES, coursePath, type Lang, type RouteKey } from "@/i18n/routes";

/** Une entrée = une URL + ses alternates hreflang (fr, en, x-default). */
function urlEntry(opts: {
  loc: string;
  frUrl: string;
  enUrl: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}) {
  return `  <url>
    <loc>${opts.loc}</loc>
    <lastmod>${opts.lastmod}</lastmod>
    <changefreq>${opts.changefreq}</changefreq>
    <priority>${opts.priority}</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${opts.frUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${opts.enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${opts.frUrl}" />
  </url>`;
}

const STATIC_PAGES: { key: RouteKey; changefreq: string; priority: string }[] = [
  { key: "home", changefreq: "weekly", priority: "1.0" },
  { key: "download", changefreq: "monthly", priority: "0.9" },
  { key: "landing", changefreq: "monthly", priority: "0.9" },
  { key: "courses", changefreq: "weekly", priority: "0.9" },
  { key: "legal", changefreq: "yearly", priority: "0.3" },
  { key: "privacy", changefreq: "yearly", priority: "0.3" },
];

function buildSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];

  for (const page of STATIC_PAGES) {
    const frUrl = absUrl(ROUTES[page.key].fr);
    const enUrl = absUrl(ROUTES[page.key].en);
    for (const loc of [frUrl, enUrl]) {
      entries.push({ ...page, loc, frUrl, enUrl, lastmod: today } as never as string);
    }
  }

  const staticXml = STATIC_PAGES.flatMap((page) => {
    const frUrl = absUrl(ROUTES[page.key].fr);
    const enUrl = absUrl(ROUTES[page.key].en);
    return [frUrl, enUrl].map((loc) =>
      urlEntry({
        loc,
        frUrl,
        enUrl,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority,
      }),
    );
  });

  const courseXml = getCourseSitemapEntries().map((entry) => {
    const lang: Lang = entry.locale;
    const frSlug = lang === "fr" ? entry.slug : entry.alternateSlug;
    const enSlug = lang === "en" ? entry.slug : entry.alternateSlug;
    const frUrl = absUrl(coursePath("fr", frSlug));
    const enUrl = absUrl(coursePath("en", enSlug));
    return urlEntry({
      loc: absUrl(coursePath(lang, entry.slug)),
      frUrl,
      enUrl,
      lastmod: entry.updatedAt,
      changefreq: "monthly",
      priority: "0.8",
    });
  });

  entries.length = 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticXml, ...courseXml].join("\n")}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
