import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/campaigns/")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/hub/ugc/campaigns", search: location.search, replace: true, statusCode: 301 } as never);
  },
});
