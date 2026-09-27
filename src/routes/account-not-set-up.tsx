import { createFileRoute } from "@tanstack/react-router";
import { NotSetUp } from "@/components/auth/NotSetUp";

export const Route = createFileRoute("/account-not-set-up")({
  ssr: false,
  head: () => ({ meta: [{ title: "Account not set up | Sophia" }, { name: "description", content: "Open the invitation link you were sent to set up your Sophia account." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Account not set up | Sophia" }, { property: "og:description", content: "Open the invitation link you were sent." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <NotSetUp />,
});
