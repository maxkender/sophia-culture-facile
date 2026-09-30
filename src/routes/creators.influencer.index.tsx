import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Adresse courte : renvoie vers la version linguistique détectée (302). */
export const Route = createFileRoute("/creators/influencer/")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs/influenceur" : "/en/creators/influencer", replace: true });
  },
  component: () => null,
});
