import { createFileRoute, redirect } from "@tanstack/react-router";
import { SlideshowSection } from "@/components/hub/Sections";

export const Route = createFileRoute("/_authenticated/hub/slideshows/$section")({
  beforeLoad: ({ params }) => {
    if (params.section === "managers" || params.section === "platform") throw redirect({ to: "/hub/slideshows/$section", params: { section: params.section === "managers" ? "applications" : "guide" }, replace: true, statusCode: 301 });
  },
  head: ({ params }) => {
    const labels: Record<string, string> = { applications: "Poster applications", posters: "Signed posters", rates: "Weekly rates", payouts: "Weekly poster payouts", guide: "Guide & links" };
    const label = labels[params.section] ?? "Slideshows";
    const title = `${label} | Sophia Slideshows`;
    const description = `Sophia slideshow ${label.toLowerCase()}: country zones, weekly work and manual administration.`;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] };
  },
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  component: function R() { const { section } = Route.useParams(); const { id } = Route.useSearch(); return <SlideshowSection key={section} section={section} id={id} />; },
});
