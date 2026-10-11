import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/campaigns/create")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/ugc/campaigns/create", replace: true, statusCode: 301 } as never);
  },
});
