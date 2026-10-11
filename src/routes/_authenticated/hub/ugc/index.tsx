import { createFileRoute } from "@tanstack/react-router";
import { HubHome } from "@/components/hub/HubHome";

export const Route = createFileRoute("/_authenticated/hub/ugc/")({
  head: () => ({ meta: [{ title: "UGC home | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: HubHome,
});
