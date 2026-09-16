import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicAuthorPage } from "@/components/pages/PublicAuthorPage";
import { getPublishedAuthor } from "@/lib/public-content.functions";
import { absUrl } from "@/config/site";
import { ldScript } from "@/lib/seo";

export const Route = createFileRoute("/fr/auteurs/$slug")({
  loader: async ({ params }) => {
    const data = await getPublishedAuthor({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Auteur introuvable" }, { name: "robots", content: "noindex" }] };
    }
    const { author, courses } = loaderData;
    const title = `${author.display_name} — auteur sur Sophia`;
    const description =
      author.short_bio ||
      [author.display_title, author.institution].filter(Boolean).join(". ") ||
      `Les cours de culture générale écrits par ${author.display_name} sur Sophia.`;
    const url = absUrl(`/auteurs/${params.slug}`);
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
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldScript({
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.display_name,
          url,
          ...(author.photo_url ? { image: author.photo_url } : {}),
          ...(author.display_title ? { jobTitle: author.display_title } : {}),
          ...(author.institution ? { affiliation: { "@type": "Organization", name: author.institution } } : {}),
          ...(author.short_bio ? { description: author.short_bio } : {}),
          sameAs: [author.orcid, author.personal_site, author.scholar_url].filter(Boolean),
          knowsAbout: [...new Set(courses.map((course) => course.subject_area).filter(Boolean))],
        }),
      ],
    };
  },
  component: AuthorRoute,
});

function AuthorRoute() {
  const { author, education, courses } = Route.useLoaderData();
  return <PublicAuthorPage author={author} education={education} courses={courses} />;
}
