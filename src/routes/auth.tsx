import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthPage } from "@/components/auth/AuthPage";

function AuthRoute() {
  const { email, reset } = Route.useSearch();
  return <AuthPage initialEmail={email ?? ""} startWithReset={reset ?? false} />;
}

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ email: z.string().email().optional(), reset: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Sign in | Sophia author portal" }, { name: "description", content: "Sign in to the Sophia author portal." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Sign in | Sophia author portal" }, { property: "og:description", content: "Sign in to the Sophia author portal." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthRoute,
});