import { createFileRoute } from "@tanstack/react-router";
import { PublishedCoursesHub } from "@/components/pages/PublishedCoursesHub";
import { listPublishedCourses } from "@/lib/public-content.functions";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/lessons/")({
  loader: () => listPublishedCourses(),
  head: () => ({
    meta: meta({
      title: "General knowledge lessons from Sophia",
      description:
        "Read Sophia's general knowledge lessons for free: history, science, society, geopolitics and culture. Short chapters, signed by academics, with sources you can check.",
      lang: "en",
      key: "courses",
    }),
    links: langLinks("courses", "en"),
  }),
  component: LessonsRoute,
});

function LessonsRoute() {
  const courses = Route.useLoaderData();
  return <PublishedCoursesHub courses={courses} />;
}
