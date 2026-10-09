import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved to the Creator Hub; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/payouts")({
  beforeLoad: () => {
    throw redirect({ ...{ to: "/hub/payouts" }, replace: true, statusCode: 301 } as never);
  },
});
