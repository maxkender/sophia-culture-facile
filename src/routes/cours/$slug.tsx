import { createFileRoute, notFound } from "@tanstack/react-router";
import { CoursePage } from "@/components/pages/CoursePage";
import { getCourse } from "@/content/api";
import { courseBreadcrumbSchema, courseLinks, courseMeta, courseSchema, ldScript } from "@/lib/seo";

export const Route = createFileRoute("/cours/$slug")({
  loader: ({ params }) => {
    const course = getCourse("fr", params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Cours introuvable" }, { name: "robots", content: "noindex" }] };
    }
    const { course } = loaderData;
    return {
      meta: courseMeta(course),
      links: courseLinks(course),
      scripts: [ldScript(courseSchema(course)), ldScript(courseBreadcrumbSchema(course))],
    };
  },
  component: CourseRoute,
});

function CourseRoute() {
  const { course } = Route.useLoaderData();
  return <CoursePage course={course} />;
}
