import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hub/learn")({
  head: () => ({ meta: [{ title: "Learn | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <div className="rounded-2xl bg-card p-6 shadow-portal">
      <p className="text-sm text-brand-navy">Briefs, reference videos, guides and templates move here in phase 3. Until then use the tools below.</p>
      <Link to="/hub/tools/$" params={{ _splat: "" }} className="mt-3 inline-block text-sm font-bold text-portal-accent">Open existing tools →</Link>
    </div>
  ),
});
