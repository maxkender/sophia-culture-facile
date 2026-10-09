import { createFileRoute, redirect } from "@tanstack/react-router";

/** Moved to the Creator Hub; kept so old links keep working. */
export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/$creatorId")({
  beforeLoad: ({ params }) => {
    throw redirect({ ...{ to: "/hub/creators/$creatorId", params: { creatorId: params.creatorId } }, replace: true, statusCode: 301 } as never);
  },
});
