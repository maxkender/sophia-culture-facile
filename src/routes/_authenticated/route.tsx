import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthPage } from "@/components/auth/AuthPage";
import { NotSetUp } from "@/components/auth/NotSetUp";
import { resolveAccountRole } from "@/lib/account-role";

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
      // Only admins have a space here (the slideshow Hub).
      setStatus(role === "admin" ? "in" : "none");
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
