import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { JoinPage } from "@/components/studio/JoinPage";

function JoinRoute() {
  const { token } = Route.useSearch();
  return <JoinPage token={token} />;
}

export const Route = createFileRoute("/auteurs/join")({
  ssr: false,
  validateSearch: z.object({ token: z.string().max(200).default("") }),
  head: () => ({
    meta: [
      { title: "Join Sophia Studio | Write courses for Sophia" },
      { name: "description", content: "Create your Sophia creator account, build your profile and write your first course." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Join Sophia Studio" },
      { property: "og:description", content: "Create your Sophia creator account and write your first course." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinRoute,
});
