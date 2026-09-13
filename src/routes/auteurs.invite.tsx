import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { InvitePage } from "@/components/portal/InvitePage";

function InviteRoute() {
  const { token } = Route.useSearch();
  return <InvitePage token={token} />;
}

export const Route = createFileRoute("/auteurs/invite")({
  ssr: false,
  validateSearch: z.object({ token: z.string().default("") }),
  head: () => ({ meta: [{ title: "Author invitation | Sophia" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: InviteRoute,
});
