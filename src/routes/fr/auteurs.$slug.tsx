import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicAuthorPage } from "@/components/pages/PublicAuthorPage";
import { getPublishedAuthor } from "@/lib/public-content.functions";
import { publishedAuthorHead } from "@/lib/seo-published";

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
    return publishedAuthorHead(loaderData.author, loaderData.courses, "fr", params.slug);
  },
  component: AuthorRoute,
});

function AuthorRoute() {
  const { author, education, courses } = Route.useLoaderData();
  return <PublicAuthorPage author={author} education={education} courses={courses} />;
}
