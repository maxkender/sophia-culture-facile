import { createFileRoute } from "@tanstack/react-router";
import { HubPayouts } from "@/components/hub/HubPayouts";

export const Route = createFileRoute("/_authenticated/hub/payouts")({
  head: () => ({ meta: [{ title: "Payouts | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: HubPayouts,
});
