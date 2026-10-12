import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/learn_/briefs/$briefId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/hub/ugc/briefs/$briefId", params, replace: true, statusCode: 301 } as never);
  },
});
