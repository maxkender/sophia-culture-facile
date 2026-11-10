import { SlideshowDocLanding } from "@/components/creators/SlideshowDoc";

/** Slideshow poster landing page (the only creator programme left on this site). */
export function SlideshowLandingPage({ app }: { app?: string | undefined } = {}) {
  return <SlideshowDocLanding app={app} />;
}
