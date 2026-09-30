import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Short address: sends to the UnSwipe slideshow page in the detected language. */
export const Route = createFileRoute("/creators/unswipe/slideshow")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs/unswipe/slideshow" : "/en/creators/unswipe/slideshow", replace: true });
  },
  component: () => null,
});
