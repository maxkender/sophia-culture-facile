import { createFileRoute, notFound } from "@tanstack/react-router";
import { CoursePage } from "@/components/pages/CoursePage";
import { getCourse } from "@/content/api";
import { courseBreadcrumbSchema, courseLinks, courseMeta, courseSchema, ldScript } from "@/lib/seo";

export const Route = createFileRoute("/en/lessons/$slug")({
  loader: ({ params }) => {
    const course = getCourse("en", params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Lesson not found" }, { name: "robots", content: "noindex" }] };
    }
    const { course } = loaderData;
    return {
      meta: courseMeta(course),
      links: courseLinks(course),
      scripts: [ldScript(courseSchema(course)), ldScript(courseBreadcrumbSchema(course))],
    };
  },
  component: LessonRoute,
});

function LessonRoute() {
  const { course } = Route.useLoaderData();
  return <CoursePage course={course} />;
}
