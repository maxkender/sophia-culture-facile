import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

export const Route = createFileRoute("/creators/slideshow/apply")({
  beforeLoad: ({ location }) => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ href: (lang === "fr" ? "/fr/candidature-slideshow" : "/en/slideshow-application") + (location.searchStr ?? ""), replace: true });
  },
  component: () => null,
});
