import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/pages/LandingPage";
import { langLinks, ldScript, meta, mobileApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/fr/sophia-culture-generale")({
  head: () => ({
    meta: meta({
      title: "Sophia, culture générale : l'app française de culture générale",
      description:
        "Sophia, culture générale : cours courts, quiz et entraînement quotidien. Application française gratuite sur iOS et Android. Télécharge-la en une minute.",
      lang: "fr",
      key: "landing",
    }),
    links: langLinks("landing", "fr"),
    scripts: [ldScript(mobileApplicationSchema("fr"))],
  }),
  component: LandingPage,
});
