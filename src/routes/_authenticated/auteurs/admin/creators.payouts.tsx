import { createFileRoute } from "@tanstack/react-router";
import { CreatorPayouts } from "@/components/portal/admin/CreatorPayouts";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/payouts")({
  component: CreatorPayouts,
});
