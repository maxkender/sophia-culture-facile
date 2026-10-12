import { createFileRoute } from "@tanstack/react-router";
import { Learn } from "@/components/hub/Learn";

export const Route = createFileRoute("/_authenticated/hub/ugc/library")({
  head: () => ({ meta: [{ title: "Video formats & assets | Sophia Hub" }, { name: "description", content: "Edit Sophia’s five UGC video formats, assets and hooks." }, { property: "og:title", content: "Video formats & assets | Sophia Hub" }, { property: "og:description", content: "Five UGC video formats, assets and hooks." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined; sub?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined, sub: typeof s["sub"] === "string" ? s["sub"] : undefined }),
  component: function R() { const { tab, sub } = Route.useSearch(); return <Learn key={`${tab}-${sub}`} initialTab={tab} sub={sub} />; },
});
