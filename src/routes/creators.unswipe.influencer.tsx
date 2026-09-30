import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLangInBrowser } from "@/lib/detect-lang";

/** Short address: sends to the UnSwipe influencer page in the detected language. */
export const Route = createFileRoute("/creators/unswipe/influencer")({
  beforeLoad: () => {
    const lang = typeof document === "undefined" ? "en" : detectLangInBrowser();
    throw redirect({ to: lang === "fr" ? "/fr/createurs/unswipe/influenceur" : "/en/creators/unswipe/influencer", replace: true });
  },
  component: () => null,
});
