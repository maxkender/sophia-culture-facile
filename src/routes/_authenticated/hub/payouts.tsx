import { createFileRoute, redirect } from "@tanstack/react-router";

/** Payouts are now one page per space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/payouts")({
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined }),
  beforeLoad: ({ search }) => {
    const to = search.tab === "slideshow" ? "/hub/slideshows/payouts" : search.tab === "influencer" ? "/hub/influencers/payouts" : "/hub/ugc/payouts";
    throw redirect({ to, replace: true, statusCode: 301 } as never);
  },
});
