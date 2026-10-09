import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hub/ads")({
  head: () => ({ meta: [{ title: "Ads | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <div className="rounded-2xl bg-card p-6 shadow-portal">
      <p className="text-sm text-brand-navy">Ads ship in phase 2: candidates, queue, live, results and connections.</p>
      <Link to="/hub/tools/$" params={{ _splat: "" }} className="mt-3 inline-block text-sm font-bold text-portal-accent">Open existing tools →</Link>
    </div>
  ),
});
