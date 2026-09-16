import { createFileRoute, notFound } from "@tanstack/react-router";
import { CoursePage } from "@/components/pages/CoursePage";
import { PublishedCoursePage } from "@/components/pages/PublishedCoursePage";
import { getCourse } from "@/content/api";
import { getPublishedCourse } from "@/lib/public-content.functions";
import { courseBreadcrumbSchema, courseLinks, courseMeta, courseSchema, ldScript } from "@/lib/seo";
import { publishedCourseHead } from "@/lib/seo-published";

export const Route = createFileRoute("/fr/cours/$slug")({
  loader: async ({ params }) => {
    const published = await getPublishedCourse({ data: { slug: params.slug } });
    if (published && published.course.language === "fr") {
      return { kind: "published" as const, ...published };
    }
    const course = getCourse("fr", params.slug);
    if (!course) throw notFound();
    return { kind: "static" as const, course };
  },
  head: ({ loaderData }) => {
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
    return publishedCourseHead(loaderData.course);
  },
  component: CourseRoute,
});

function CourseRoute() {
  const data = Route.useLoaderData();
  if (data.kind === "static") return <CoursePage course={data.course} />;
  return <PublishedCoursePage course={data.course} related={data.related} />;
}
