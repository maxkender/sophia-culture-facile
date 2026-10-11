import { createFileRoute } from "@tanstack/react-router";
import { SlideshowSection } from "@/components/hub/Sections";

export const Route = createFileRoute("/_authenticated/hub/slideshows/$section")({
  head: () => ({ meta: [{ title: "Slideshows | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({ id: typeof s["id"] === "string" ? s["id"] : undefined }),
  component: function R() { const { section } = Route.useParams(); const { id } = Route.useSearch(); return <SlideshowSection key={section} section={section} id={id} />; },
});
