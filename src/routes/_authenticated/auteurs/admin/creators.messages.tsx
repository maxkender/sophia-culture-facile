import { createFileRoute } from "@tanstack/react-router";
import { CreatorInbox } from "@/components/portal/admin/CreatorInbox";

export const Route = createFileRoute("/_authenticated/auteurs/admin/creators/messages")({
  component: CreatorInbox,
});
