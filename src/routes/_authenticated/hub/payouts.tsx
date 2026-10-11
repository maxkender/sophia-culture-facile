import { createFileRoute } from "@tanstack/react-router";
import { PayoutsSection } from "@/components/hub/Sections";

export const Route = createFileRoute("/_authenticated/hub/payouts")({
  head: () => ({ meta: [{ title: "Payouts | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined } => ({ tab: typeof s["tab"] === "string" ? s["tab"] : undefined }),
  component: function R() { const { tab } = Route.useSearch(); return <PayoutsSection tab={tab} />; },
});
