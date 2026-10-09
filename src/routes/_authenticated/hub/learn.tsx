import { createFileRoute } from "@tanstack/react-router";
import { Learn } from "@/components/hub/Learn";

export const Route = createFileRoute("/_authenticated/hub/learn")({
  head: () => ({ meta: [{ title: "Learn | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Learn,
});
