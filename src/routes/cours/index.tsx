import { createFileRoute } from "@tanstack/react-router";
import { PublishedCoursesHub } from "@/components/pages/PublishedCoursesHub";
import { listPublishedCourses } from "@/lib/public-content.functions";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/cours/")({
  loader: () => listPublishedCourses(),
  head: () => ({
    meta: meta({
      title: "Les cours de culture générale de Sophia",
      description:
        "Tous les cours de culture générale de Sophia, écrits et signés par des universitaires et des spécialistes : histoire, sciences, littérature, art, mythologie, monde actuel.",
      lang: "fr",
      key: "courses",
    }),
    links: langLinks("courses", "fr"),
  }),
  component: CoursesRoute,
});

function CoursesRoute() {
  const courses = Route.useLoaderData();
  return <PublishedCoursesHub courses={courses} />;
}
