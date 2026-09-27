import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

export const Route = createFileRoute("/creators/ugc/apply")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/candidature-ugc" : "/en/ugc-application", replace: true });
  },
  component: () => null,
});
