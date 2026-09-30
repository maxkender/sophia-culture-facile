import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Short address for the UnSwipe creator programme: sends to the detected language. */
export const Route = createFileRoute("/creators/unswipe")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs/unswipe" : "/en/creators/unswipe", replace: true });
  },
  component: () => null,
});
