import { createFileRoute, redirect } from "@tanstack/react-router";

/** Hidden from the simplified UGC space (code kept dormant); old links land on UGC Home. */
export const Route = createFileRoute("/_authenticated/hub/ugc/campaigns/")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/ugc", replace: true });
  },
});
