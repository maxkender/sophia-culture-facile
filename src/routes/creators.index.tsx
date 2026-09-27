import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Adresse courte : renvoie vers la version linguistique détectée (302). */
export const Route = createFileRoute("/creators/")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs" : "/en/creators", replace: true });
  },
  component: () => null,
});
