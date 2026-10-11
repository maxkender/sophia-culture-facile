import { createFileRoute } from "@tanstack/react-router";
import { HubPayouts } from "@/components/hub/HubPayouts";

export const Route = createFileRoute("/_authenticated/hub/ugc/payouts")({
  head: () => ({ meta: [{ title: "UGC payouts | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: HubPayouts,
});
