import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/applications")({
  beforeLoad: () => {
    throw redirect({ to: "/auteurs/admin/creators/ugc-applications" });
  },
});
