import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Adresse courte : renvoie vers la version linguistique détectée (302). */
export const Route = createFileRoute("/creators/slideshow/")({
  beforeLoad: ({ location }) => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ href: (lang === "fr" ? "/fr/createurs/slideshow" : "/en/creators/slideshow") + (location.searchStr ?? ""), replace: true });
  },
  component: () => null,
});
