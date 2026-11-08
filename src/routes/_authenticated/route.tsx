import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthPage } from "@/components/auth/AuthPage";
import { NotSetUp } from "@/components/auth/NotSetUp";
import { homeFor, resolveAccountRole } from "@/lib/account-role";

/** Pages the onboarding wizard opens in a new tab. */
const ONBOARDING_EXEMPT = /^\/auteurs\/(guide|examples|contract)(\/|$)/;

/**
 * /auteurs is the URL authors guess, so an unauthenticated visitor is shown the
 * sign-in form in place. Signed-in users are routed by role: creators never see
 * the author portal.
 */
function Gate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "in" | "out" | "none">("loading");

  useEffect(() => {
    let active = true;
    async function check() {
      const role = await resolveAccountRole();
      if (!active) return;
      if (role === null) return setStatus("out");
      if (role === "creator" || role === "influencer") {
        window.location.replace(homeFor(role));
        return;
      }
      if (role === "author" && window.location.pathname.startsWith("/auteurs") && !ONBOARDING_EXEMPT.test(window.location.pathname)) {
        // Studio v2: authors who have not finished onboarding resume the wizard.
        const { data: u } = await supabase.auth.getUser();
        const { data: p } = await supabase.from("profiles").select("onboarding_step").eq("user_id", u.user?.id ?? "").maybeSingle();
        if (!active) return;
        if (p && p.onboarding_step !== "done") {
          window.location.replace("/auteurs/join");
          return;
        }
      }
      setStatus(role === "none" ? "none" : "in");
    }
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void check();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (status === "loading") return <div className="min-h-screen bg-portal-bg" />;
  if (status === "out") return <AuthPage />;
  if (status === "none") return <NotSetUp />;
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Gate,
});
