import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth/AuthPage";
import { useRedirectIfSignedIn } from "@/components/auth/LoginRedirect";

function AuthorLogin() {
  useRedirectIfSignedIn();
  return <AuthPage />;
}

export const Route = createFileRoute("/auteurs/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in | Sophia author space" }, { name: "description", content: "Sign in to the Sophia author space." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Sign in | Sophia author space" }, { property: "og:description", content: "Sign in to the Sophia author space." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthorLogin,
});
