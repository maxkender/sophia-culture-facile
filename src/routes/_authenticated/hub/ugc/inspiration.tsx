import { createFileRoute } from "@tanstack/react-router";
import { Inspiration } from "@/components/hub/Inspiration";

export const Route = createFileRoute("/_authenticated/hub/ugc/inspiration")({
  head: () => ({ meta: [{ title: "Inspiration | Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Inspiration,
});
