import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/HomePage";
import {
  faqSchema,
  ldScript,
  langLinks,
  meta,
  mobileApplicationSchema,
  organizationSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/en/")({
  head: () => ({
    meta: meta({
      title: "Sophia: General Knowledge | Learn something new in 5 minutes a day",
      description:
        "Sophia: General Knowledge is a free app for learning something new every day. Five-minute lessons, a quiz after each one, and a streak that keeps you coming back. iOS and Android.",
      lang: "en",
      key: "home",
    }),
    links: langLinks("home", "en"),
    scripts: [
      ldScript(mobileApplicationSchema("en")),
      ldScript(organizationSchema("en")),
      ldScript(faqSchema("en")),
    ],
  }),
  component: HomePage,
});
