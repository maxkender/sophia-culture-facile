import { createFileRoute, redirect } from "@tanstack/react-router";
import { SlideshowsHome } from "@/components/hub/slides/SlideshowsHome";

const OLD: Record<string, string> = { applications: "applications", assign: "applications", creators: "posters", zones: "rates", guide: "guide", platform: "guide" };

export const Route = createFileRoute("/_authenticated/hub/slideshows/")({
  head: () => ({ meta: [{ title: "Slideshow week overview | Sophia Hub" }, { name: "description", content: "Pending poster applications by zone, upcoming starts and weekly payouts to approve." }, { property: "og:title", content: "Slideshow week overview | Sophia Hub" }, { property: "og:description", content: "Pending poster applications by zone, upcoming starts and weekly payouts to approve." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined }),
  beforeLoad: ({ search }) => {
    if (search.tab) throw redirect({ to: "/hub/slideshows/$section", params: { section: OLD[search.tab] ?? "applications" }, replace: true, statusCode: 301 } as never);
  },
  component: SlideshowsHome,
});
