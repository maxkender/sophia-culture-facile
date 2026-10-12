import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved to the Creator Hub; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/applications")({
  beforeLoad: () => {
    throw redirect({ ...{ to: "/hub/ugc/creators", search: { view: "applications" } }, replace: true, statusCode: 301 } as never);
  },
});
