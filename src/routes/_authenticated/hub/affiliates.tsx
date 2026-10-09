import { createFileRoute } from "@tanstack/react-router";
import { Affiliates } from "@/components/hub/Affiliates";

export const Route = createFileRoute("/_authenticated/hub/affiliates")({
  head: () => ({ meta: [{ title: "Affiliates | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Affiliates,
});
