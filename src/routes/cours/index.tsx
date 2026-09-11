import { createFileRoute } from "@tanstack/react-router";
import { CoursesHubPage } from "@/components/pages/CoursesHubPage";
import { langLinks, meta } from "@/lib/seo";

export const Route = createFileRoute("/cours/")({
  head: () => ({
    meta: meta({
      title: "Les cours de culture générale de Sophia",
      description:
        "Tous les cours de culture générale de Sophia, à lire gratuitement : histoire, sciences, société, géopolitique, culture. Cinq chapitres par dossier, sources citées.",
      lang: "fr",
      key: "courses",
    }),
    links: langLinks("courses", "fr"),
  }),
  component: CoursesHubPage,
});
