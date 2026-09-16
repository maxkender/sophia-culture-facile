import { createFileRoute, notFound } from "@tanstack/react-router";
import { CoursePage } from "@/components/pages/CoursePage";
import { PublishedCoursePage } from "@/components/pages/PublishedCoursePage";
import { getCourse } from "@/content/api";
import { getPublishedCourse } from "@/lib/public-content.functions";
import { absUrl, OG_IMAGE_URL } from "@/config/site";
import { subjectLabel } from "@/config/subjects";
import { courseBreadcrumbSchema, courseLinks, courseMeta, courseSchema, ldScript } from "@/lib/seo";

export const Route = createFileRoute("/fr/cours/$slug")({
  loader: async ({ params }) => {
    const published = await getPublishedCourse({ data: { slug: params.slug } });
    if (published) return { kind: "published" as const, ...published };
    const course = getCourse("fr", params.slug);
    if (!course) throw notFound();
    return { kind: "static" as const, course };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Cours introuvable" }, { name: "robots", content: "noindex" }] };
    }
    if (loaderData.kind === "static") {
      const { course } = loaderData;
      return {
        meta: courseMeta(course),
        links: courseLinks(course),
        scripts: [ldScript(courseSchema(course)), ldScript(courseBreadcrumbSchema(course))],
      };
    }

    const { course } = loaderData;
    const url = absUrl(`/cours/${params.slug}`);
    const description =
      course.subtitle ||
      (course.screens[0]?.body ?? "").replace(/\*\*/g, "").slice(0, 155) ||
      `${course.title} — un cours de culture générale signé sur Sophia.`;
    const image = course.author?.photo_url ?? OG_IMAGE_URL;
    return {
      meta: [
        { title: `${course.title} | Sophia` },
        { name: "description", content: description.slice(0, 160) },
        { property: "og:title", content: course.title },
        { property: "og:description", content: description.slice(0, 160) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: course.title,
          description: description.slice(0, 160),
          url,
          image,
          inLanguage: "fr",
          articleSection: subjectLabel(course.subject_area),
          ...(course.published_at ? { datePublished: course.published_at } : {}),
          ...(course.author
            ? {
                author: {
                  "@type": "Person",
                  name: course.author.display_name,
                  ...(course.author.slug ? { url: absUrl(`/auteurs/${course.author.slug}`) } : {}),
                  ...(course.author.display_title ? { jobTitle: course.author.display_title } : {}),
                },
              }
            : {}),
          publisher: { "@type": "Organization", name: "Sophia", url: absUrl("/") },
        }),
      ],
    };
  },
  component: CourseRoute,
});

function CourseRoute() {
  const data = Route.useLoaderData();
  if (data.kind === "static") return <CoursePage course={data.course} />;
  return <PublishedCoursePage course={data.course} related={data.related} />;
}
