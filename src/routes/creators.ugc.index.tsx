import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Adresse courte : renvoie vers la version linguistique détectée (302). */
export const Route = createFileRoute("/creators/ugc/")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs/ugc" : "/en/creators/ugc", replace: true });
  },
  component: () => null,
});
