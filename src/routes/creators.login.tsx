import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@/components/creators/CreatorSpace";
import { useRedirectIfSignedIn } from "@/components/auth/LoginRedirect";

function CreatorLogin() {
  useRedirectIfSignedIn();
  return (
    <div className="min-h-screen bg-portal-bg pb-[env(safe-area-inset-bottom)]">
      <SignIn invite={null} invitedEmail="" standalone />
    </div>
  );
}

export const Route = createFileRoute("/creators/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in | Sophia creator space" }, { name: "description", content: "Sign in to the Sophia creator space." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Sign in | Sophia creator space" }, { property: "og:description", content: "Sign in to the Sophia creator space." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CreatorLogin,
});
