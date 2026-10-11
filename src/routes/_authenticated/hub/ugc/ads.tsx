import { createFileRoute } from "@tanstack/react-router";
import { Ads } from "@/components/hub/Ads";

export const Route = createFileRoute("/_authenticated/hub/ugc/ads")({
  head: () => ({ meta: [{ title: "Ads | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Ads,
});
