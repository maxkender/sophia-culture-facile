import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old "All existing tools" pages: each now lives in a Hub section; kept as permanent redirects. */
const MOVED: Record<string, { to: string; search?: Record<string, string> }> = {
  overview: { to: "/hub/ugc/creators", search: { view: "overview" } },
  "ugc-applications": { to: "/hub/ugc/creators", search: { view: "applications" } },
  prospects: { to: "/hub/ugc/creators", search: { view: "prospects" } },
  compliance: { to: "/hub/ugc/creators", search: { view: "compliance" } },
  "slideshow-applications": { to: "/hub/slideshows/applications" },
  "ugc-briefs": { to: "/hub/ugc/library", search: { tab: "Briefs", sub: "scripts" } },
  planner: { to: "/hub/ugc/library", search: { tab: "Briefs", sub: "planner" } },
  ops: { to: "/hub/ugc/library", search: { tab: "Briefs", sub: "ops" } },
  integrations: { to: "/hub/settings", search: { tab: "connections" } },
  apps: { to: "/hub/settings", search: { tab: "apps" } },
  "influencer-applications": { to: "/hub/influencers", search: { tab: "applications" } },
  influencers: { to: "/hub/influencers", search: { tab: "influencers" } },
  "influencer-briefs": { to: "/hub/influencers", search: { tab: "offers" } },
  "influencer-deals": { to: "/hub/influencers", search: { tab: "deals" } },
  "influencer-messages": { to: "/hub/influencers", search: { tab: "messages" } },
  "influencer-payouts": { to: "/hub/influencers/payouts" },
  "influencer-performance": { to: "/hub/influencers", search: { tab: "performance" } },
  "influencer-settings": { to: "/hub/influencers", search: { tab: "settings" } },
};

export const Route = createFileRoute("/_authenticated/hub/tools/$")({
  beforeLoad: ({ params }) => {
    const [tool, id] = (params._splat ?? "").split("/");
    const m = MOVED[tool ?? ""] ?? { to: "/hub" };
    throw redirect({ to: m.to, search: { ...(m.search ?? {}), ...(id ? { id } : {}) }, replace: true, statusCode: 301 } as never);
  },
});
