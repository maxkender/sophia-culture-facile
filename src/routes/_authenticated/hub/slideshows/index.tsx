import { createFileRoute, redirect } from "@tanstack/react-router";
import { SlideshowsHome } from "@/components/hub/slides/SlideshowsHome";

const OLD: Record<string, string> = { applications: "applications", assign: "managers", creators: "posters", zones: "rates", guide: "guide", platform: "platform" };

export const Route = createFileRoute("/_authenticated/hub/slideshows/")({
  head: () => ({ meta: [{ title: "Slideshows | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined }),
  beforeLoad: ({ search }) => {
    if (search.tab) throw redirect({ to: "/hub/slideshows/$section", params: { section: OLD[search.tab] ?? "applications" }, replace: true, statusCode: 301 } as never);
  },
  component: SlideshowsHome,
});
