import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in | Sophia author portal" }, { name: "description", content: "Sign in to the Sophia author portal." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Sign in | Sophia author portal" }, { property: "og:description", content: "Sign in to the Sophia author portal." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});