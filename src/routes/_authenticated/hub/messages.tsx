import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/messages")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/hub/ugc/messages", search: location.search, replace: true, statusCode: 301 } as never);
  },
});
