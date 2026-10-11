import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { homeFor, resolveAccountRole } from "@/lib/account-role";
import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@/components/creators/CreatorSpace";
import { CreatorLangSwitch, initCreatorLang, useCreatorLang } from "@/i18n/creator-app";
import { useRedirectIfSignedIn } from "@/components/auth/LoginRedirect";

function CreatorLogin() {
  initCreatorLang(null, null);
  useCreatorLang();
  useRedirectIfSignedIn();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const u = new URL(window.location.href);
    const th = u.searchParams.get("th");
    if (!th) return;
    const ty = (u.searchParams.get("ty") ?? "magiclink") as "magiclink";
    void supabase.auth.verifyOtp({ token_hash: th, type: ty }).then(async ({ error }) => {
      if (error) { setFailed(true); window.history.replaceState(null, "", "/creators/login"); return; }
      const role = await resolveAccountRole();
      window.location.assign(role ? homeFor(role) : "/creators/app");
    });
  }, []);
  return (
    <div className="min-h-screen bg-portal-bg pb-[env(safe-area-inset-bottom)]">
      {failed ? <p className="mx-auto max-w-sm px-6 pt-6 text-sm text-brand-navy">Ce lien a déjà servi ou a expiré. Demande-en un nouveau ci-dessous. / This link was used or expired.</p> : null}
      <div className="flex justify-end px-4 pt-4"><CreatorLangSwitch /></div>
      <SignIn invite={null} invitedEmail="" standalone />
    </div>
  );
}

export const Route = createFileRoute("/creators/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in | Sophia creator space" }, { name: "description", content: "Sign in to the Sophia creator space." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Sign in | Sophia creator space" }, { property: "og:description", content: "Sign in to the Sophia creator space." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CreatorLogin,
});
