import { createFileRoute } from "@tanstack/react-router";
import { CreatorInbox } from "@/components/portal/admin/CreatorInbox";

export const Route = createFileRoute("/_authenticated/hub/ugc/messages")({
  head: () => ({ meta: [{ title: "Messages | Creator Hub" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CreatorInbox,
});
