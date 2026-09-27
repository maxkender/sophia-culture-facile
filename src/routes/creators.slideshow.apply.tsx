import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

export const Route = createFileRoute("/creators/slideshow/apply")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/candidature-slideshow" : "/en/slideshow-application", replace: true });
  },
  component: () => null,
});
