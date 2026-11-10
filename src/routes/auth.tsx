import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthPage } from "@/components/auth/AuthPage";

function AuthRoute() {
  const { email, reset } = Route.useSearch();
  return <AuthPage initialEmail={email ?? ""} startWithReset={reset ?? false} />;
}

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ email: z.string().email().optional(), reset: z.boolean().optional() }),
  head: () => ({ meta: [{ title: "Sign in | Vik Studios Hub" }, { name: "description", content: "Admin sign-in for the Vik Studios slideshow Hub." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Sign in | Vik Studios Hub" }, { property: "og:description", content: "Admin sign-in for the Vik Studios slideshow Hub." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthRoute,
});