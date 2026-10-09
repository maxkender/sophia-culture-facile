import { createFileRoute } from "@tanstack/react-router";
import { Discover } from "@/components/hub/Discover";

export const Route = createFileRoute("/_authenticated/hub/discover")({
  head: () => ({ meta: [{ title: "Discover | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Discover,
});
