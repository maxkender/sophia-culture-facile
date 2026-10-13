import { createFileRoute } from "@tanstack/react-router";
import { PaymentsOff } from "@/components/hub/Sections";

export const Route = createFileRoute("/_authenticated/hub/ugc/payouts")({
  head: () => ({ meta: [{ title: "UGC payouts | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PaymentsOff,
});
