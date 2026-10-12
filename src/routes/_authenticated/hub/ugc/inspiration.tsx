import { createFileRoute } from "@tanstack/react-router";
import { Inspiration } from "@/components/hub/Inspiration";

export const Route = createFileRoute("/_authenticated/hub/ugc/inspiration")({
  head: () => ({ meta: [{ title: "Inspiration | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { open?: string | undefined } => ({ open: typeof s["open"] === "string" ? s["open"] : undefined }),
  component: function R() { const { open } = Route.useSearch(); return <Inspiration initialOpen={open} />; },
});
