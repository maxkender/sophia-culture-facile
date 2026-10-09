import { createFileRoute } from "@tanstack/react-router";
import { Discover } from "@/components/hub/Discover";
import { AccountPool } from "@/components/hub/AccountPool";

export const Route = createFileRoute("/_authenticated/hub/discover")({
  head: () => ({ meta: [{ title: "Discover | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <div className="space-y-5"><AccountPool /><Discover /></div>,
});
