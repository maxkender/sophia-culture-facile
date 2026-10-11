import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/learn")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/hub/ugc/library", search: location.search, replace: true, statusCode: 301 } as never);
  },
});
