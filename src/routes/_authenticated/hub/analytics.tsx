import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hub/analytics")({
  head: () => ({ meta: [{ title: "Analytics | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <div className="rounded-2xl bg-card p-6 shadow-portal">
      <p className="text-sm text-brand-navy">Full analytics ship in phase 3. The Home performance card already reads daily snapshots.</p>
      <Link to="/hub/tools/$" params={{ _splat: "" }} className="mt-3 inline-block text-sm font-bold text-portal-accent">Open existing tools →</Link>
    </div>
  ),
});
