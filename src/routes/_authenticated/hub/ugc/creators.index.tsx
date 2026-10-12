import { createFileRoute, redirect } from "@tanstack/react-router";
import { UgcCreatorsPage } from "@/components/hub/UgcCreatorsList";

const VIEWS = [["applications", "Applications"], ["directory", "Creators"]] as const;
type View = (typeof VIEWS)[number][0];

export const Route = createFileRoute("/_authenticated/hub/ugc/creators/")({
  head: () => ({ meta: [{ title: "UGC Creators | Sophia Hub" }, { name: "description", content: "Sophia UGC applications and active creators." }, { property: "og:title", content: "UGC Creators | Sophia Hub" }, { property: "og:description", content: "Sophia UGC applications and active creators." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; add?: number | undefined; view?: View | undefined } => ({ q: typeof s["q"] === "string" ? s["q"].slice(0, 120) : undefined, add: s["add"] ? 1 : undefined, view: VIEWS.some(([k]) => k === s["view"]) ? (s["view"] as View) : undefined }),
  beforeLoad: ({ search }) => { if (search.view === "applications") throw redirect({ to: "/hub/ugc/applications", replace: true }); },
  component: function CreatorsRoute() { return <UgcCreatorsPage view="directory" />; },
});
