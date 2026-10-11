import { createFileRoute } from "@tanstack/react-router";
import { Analytics } from "@/components/hub/Analytics";

export const Route = createFileRoute("/_authenticated/hub/ugc/analytics")({
  head: () => ({ meta: [{ title: "Analytics | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Analytics,
});
