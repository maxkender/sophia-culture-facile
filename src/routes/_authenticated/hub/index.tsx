import { createFileRoute } from "@tanstack/react-router";
import { HubHome } from "@/components/hub/HubHome";

export const Route = createFileRoute("/_authenticated/hub/")({
  head: () => ({ meta: [{ title: "Home | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: HubHome,
});
