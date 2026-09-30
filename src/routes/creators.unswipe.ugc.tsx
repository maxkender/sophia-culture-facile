import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Short address: sends to the UnSwipe ugc page in the detected language. */
export const Route = createFileRoute("/creators/unswipe/ugc")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs/unswipe/ugc" : "/en/creators/unswipe/ugc", replace: true });
  },
  component: () => null,
});
