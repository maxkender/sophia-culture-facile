import { createFileRoute, redirect } from "@tanstack/react-router";

/** Hidden from creators (code dormant); old links go to the creator home. */
export const Route = createFileRoute("/creators/app/tasks")({
  beforeLoad: () => { throw redirect({ to: "/creators/app", replace: true }); },
});
