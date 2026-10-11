import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved into a Hub space; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/hub/creators/$creatorId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/hub/ugc/creators/$creatorId", params, replace: true, statusCode: 301 } as never);
  },
});
