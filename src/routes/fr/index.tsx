import { createFileRoute } from "@tanstack/react-router";
import { MarketingHome } from "@/components/marketing/pages";
import {
  faqSchema,
  ldScript,
  langLinks,
  meta,
  mobileApplicationSchema,
  organizationSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/fr/")({
  head: () => ({
    meta: meta({
      title: "Sophia, culture générale | L'application pour apprendre chaque jour",
      description:
        "Sophia, culture générale est l'application mobile française gratuite pour apprendre la culture générale chaque jour : cours courts, quiz et révision quotidienne. iOS et Android.",
      lang: "fr",
      key: "home",
    }),
    links: langLinks("home", "fr"),
    scripts: [
      ldScript(mobileApplicationSchema("fr")),
      ldScript(organizationSchema("fr")),
      ldScript(faqSchema("fr")),
    ],
  }),
  component: MarketingHome,
});
