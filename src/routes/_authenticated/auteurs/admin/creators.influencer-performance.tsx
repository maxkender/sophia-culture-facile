import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved to the Creator Hub; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencer-performance")({
  beforeLoad: ({ params }) => {
    throw redirect({ ...{ to: "/hub/tools/$", params: { _splat: "influencer-performance" } }, replace: true, statusCode: 301 } as never);
  },
});
