import { createFileRoute, Link } from "@tanstack/react-router";
import { Discover } from "@/components/hub/Discover";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";
import { cn } from "@/lib/utils";

const VIEWS = [["applications", "Applications"], ["directory", "Creators"]] as const;
type View = (typeof VIEWS)[number][0];

export const Route = createFileRoute("/_authenticated/hub/ugc/creators/")({
  head: () => ({ meta: [{ title: "UGC Creators | Sophia Hub" }, { name: "description", content: "Sophia UGC applications and active creators." }, { property: "og:title", content: "UGC Creators | Sophia Hub" }, { property: "og:description", content: "Sophia UGC applications and active creators." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; add?: number | undefined; view?: View | undefined } => ({ q: typeof s["q"] === "string" ? s["q"].slice(0, 120) : undefined, add: s["add"] ? 1 : undefined, view: VIEWS.some(([k]) => k === s["view"]) ? (s["view"] as View) : undefined }),
  component: function DiscoverRoute() {
    const { q, add, view = "applications" } = Route.useSearch();
    return (
      <div className="space-y-5">
        <div className="flex gap-1 overflow-x-auto border-b border-brand-line">{VIEWS.map(([k, l]) => <Link key={k} to="/hub/ugc/creators" search={{ view: k }} className={cn("shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold", view === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l}</Link>)}</div>
        {view === "directory" ? <Discover key={`${q ?? ""}-${add ?? 0}`} initialQ={q} initialAdd={Boolean(add)} /> : <CreatorApplications key="ugc" track="ugc" />}
      </div>
    );
  },
});
