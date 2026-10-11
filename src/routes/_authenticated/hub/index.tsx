import { createFileRoute, redirect } from "@tanstack/react-router";
import { lastSpace, SPACE_HOME } from "@/components/hub/spaces";

/** /hub opens the last used space (UGC by default). */
export const Route = createFileRoute("/_authenticated/hub/")({
  beforeLoad: () => {
    throw redirect({ to: SPACE_HOME[lastSpace()], replace: true } as never);
  },
});
