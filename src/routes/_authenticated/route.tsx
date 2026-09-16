import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthPage } from "@/components/auth/AuthPage";

/**
 * /auteurs is the URL authors guess, so an unauthenticated visitor is shown the
 * sign-in form in place rather than being bounced away.
 */
function Gate() {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (active) setStatus(error || !data.user ? "out" : "in");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setStatus(session?.user ? "in" : "out");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") return <div className="min-h-screen bg-portal-bg" />;
  if (status === "out") return <AuthPage />;
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Gate,
});
