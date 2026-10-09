import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved to the Creator Hub; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/ugc-applications")({
  beforeLoad: ({ params }) => {
    throw redirect({ ...{ to: "/hub/tools/$", params: { _splat: "ugc-applications" } }, replace: true, statusCode: 301 } as never);
  },
});
