import { createFileRoute } from "@tanstack/react-router";
import { getCourseSitemapEntries } from "@/content/api";
import { getPublishedSitemapEntries } from "@/lib/public-content.functions";
import { absUrl } from "@/config/site";
import { ROUTES, coursePath, type RouteKey } from "@/i18n/routes";

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
    <xhtml:link rel="alternate" hreflang="x-default" href="${opts.enUrl}" />
  </url>`;
}

const STATIC_PAGES: { key: RouteKey; changefreq: string; priority: string }[] = [
  { key: "home", changefreq: "weekly", priority: "1.0" },
  { key: "download", changefreq: "monthly", priority: "0.9" },
  { key: "landing", changefreq: "monthly", priority: "0.9" },
  { key: "courses", changefreq: "weekly", priority: "0.9" },
  { key: "apply", changefreq: "monthly", priority: "0.5" },
  { key: "legal", changefreq: "yearly", priority: "0.3" },
  { key: "privacy", changefreq: "yearly", priority: "0.3" },
];

/** Sitemap généré à la volée : les cours viennent de `src/content/api.ts`. */
async function buildSitemap(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);

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
    const frSlug = entry.locale === "fr" ? entry.slug : entry.alternateSlug;
    const enSlug = entry.locale === "en" ? entry.slug : entry.alternateSlug;
    return urlEntry({
      loc: absUrl(coursePath(entry.locale, entry.slug)),
      frUrl: absUrl(coursePath("fr", frSlug)),
      enUrl: absUrl(coursePath("en", enSlug)),
      lastmod: entry.updatedAt,
      changefreq: "monthly",
      priority: "0.8",
    });
  });

  // Cours publiés depuis le portail auteur : URL françaises uniques, sans alternates.
  let publishedXml: string[] = [];
  try {
    const entries = await getPublishedSitemapEntries();
    publishedXml = entries.map(
      (entry) => `  <url>
    <loc>${absUrl(entry.path)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    );
  } catch {
    publishedXml = [];
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticXml, ...courseXml, ...publishedXml].join("\n")}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await buildSitemap(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
