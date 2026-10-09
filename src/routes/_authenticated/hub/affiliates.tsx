import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hub/affiliates")({
  head: () => ({ meta: [{ title: "Affiliates | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => (
    <div className="rounded-2xl bg-card p-6 shadow-portal">
      <p className="text-sm text-brand-navy">The referral programme ships in phase 3.</p>
      <Link to="/hub/tools/$" params={{ _splat: "" }} className="mt-3 inline-block text-sm font-bold text-portal-accent">Open existing tools →</Link>
    </div>
  ),
});
