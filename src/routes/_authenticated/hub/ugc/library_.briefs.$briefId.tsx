import { createFileRoute, redirect } from "@tanstack/react-router";

/** Briefs moved out of Library; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/ugc/library_/briefs/$briefId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/hub/ugc/briefs/$briefId", params, replace: true, statusCode: 301 } as never);
  },
});
