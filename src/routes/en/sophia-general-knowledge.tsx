import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/pages/LandingPage";
import { langLinks, ldScript, meta, mobileApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/en/sophia-general-knowledge")({
  head: () => ({
    meta: meta({
      title: "Sophia: General Knowledge, the daily learning app",
      description:
        "Short lessons, quick quizzes, and a streak you won't want to break. Sophia: General Knowledge is free on iOS and Android. Download it in a minute.",
      lang: "en",
      key: "landing",
    }),
    links: langLinks("landing", "en"),
    scripts: [ldScript(mobileApplicationSchema("en"))],
  }),
  component: LandingPage,
});
