import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

export const Route = createFileRoute("/creators/influencer/apply")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/candidature-influenceur" : "/en/influencer-application", replace: true });
  },
  component: () => null,
});
