import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved to the Creator Hub; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/influencers/$influencerId")({
  beforeLoad: ({ params }) => {
    throw redirect({ ...{ to: "/hub/tools/$", params: { _splat: `influencers/${params.influencerId}` } }, replace: true, statusCode: 301 } as never);
  },
});
