import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/**
 * Racine du site : renvoie vers la version linguistique détectée.
 * Le vrai aiguillage se fait côté serveur (302, voir `src/server.ts`) ;
 * cette route couvre les navigations côté client vers « / ».
 */
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Sophia — General knowledge / Culture générale" }, { name: "description", content: "Discover Sophia's short general-knowledge lessons in French and English." }, { property: "og:title", content: "Sophia — General knowledge / Culture générale" }, { property: "og:description", content: "Discover Sophia's short general-knowledge lessons in French and English." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr" : "/en", replace: true });
  },
  component: () => null,
});
