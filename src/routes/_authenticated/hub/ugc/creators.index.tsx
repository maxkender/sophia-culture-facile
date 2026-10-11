import { createFileRoute, Link } from "@tanstack/react-router";
import { Discover } from "@/components/hub/Discover";
import { AccountPool } from "@/components/hub/AccountPool";
import { CreatorProspects } from "@/components/portal/admin/CreatorProspects";
import { CreatorsDashboard } from "@/components/portal/admin/CreatorsDashboard";
import { UgcComplianceDashboard } from "@/components/portal/admin/UgcAdmin";
import { CreatorApplications } from "@/components/portal/admin/CreatorApplications";
import { cn } from "@/lib/utils";

const VIEWS = [["directory", "Directory"], ["applications", "UGC applications"], ["prospects", "Prospects"], ["compliance", "Compliance"], ["overview", "Programme overview"]] as const;
type View = (typeof VIEWS)[number][0];

export const Route = createFileRoute("/_authenticated/hub/ugc/creators/")({
  head: () => ({ meta: [{ title: "Creators | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; add?: number | undefined; view?: View | undefined } => ({ q: typeof s["q"] === "string" ? s["q"].slice(0, 120) : undefined, add: s["add"] ? 1 : undefined, view: VIEWS.some(([k]) => k === s["view"]) ? (s["view"] as View) : undefined }),
  component: function DiscoverRoute() {
    const { q, add, view = "directory" } = Route.useSearch();
    return (
      <div className="space-y-5">
        <div className="flex gap-1 overflow-x-auto border-b border-brand-line">{VIEWS.map(([k, l]) => <Link key={k} to="/hub/ugc/creators" search={{ view: k }} className={cn("shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold", view === k ? "border-brand-navy text-brand-navy" : "border-transparent text-brand-navySoft")}>{l}</Link>)}</div>
        {view === "directory" ? <><AccountPool /><Discover key={`${q ?? ""}-${add ?? 0}`} initialQ={q} initialAdd={Boolean(add)} /></>
          : view === "applications" ? <CreatorApplications key="ugc" track="ugc" />
          : view === "prospects" ? <CreatorProspects /> : view === "compliance" ? <UgcComplianceDashboard /> : <CreatorsDashboard />}
      </div>
    );
  },
});
