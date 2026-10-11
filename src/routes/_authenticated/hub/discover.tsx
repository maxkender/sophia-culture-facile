import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/discover")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/hub/ugc/creators", search: location.search, replace: true, statusCode: 301 } as never);
  },
});
