import { createFileRoute } from "@tanstack/react-router";
import { CreatorPayouts } from "@/components/portal/admin/CreatorPayouts";

export const Route = createFileRoute("/_authenticated/hub/payouts")({
  head: () => ({ meta: [{ title: "Payouts | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CreatorPayouts,
});
