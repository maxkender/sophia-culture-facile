import { createFileRoute } from "@tanstack/react-router";
import { CoursesHubPage } from "@/components/pages/CoursesHubPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/en/lessons/")({
  head: () => ({
    meta: meta({
      title: "General knowledge lessons from Sophia",
      description:
        "Read Sophia's general knowledge lessons for free: history, science, society, geopolitics and culture. Five short chapters per guide, with sources you can check.",
      lang: "en",
      key: "courses",
    }),
    links: langLinks("courses", "en"),
  }),
  component: CoursesHubPage,
});
