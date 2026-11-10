import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function NotSetUp({ loginTo = "/auth" }: { loginTo?: "/auth" }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg p-6">
      <div className="w-full max-w-md rounded-2xl border border-brand-line bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-brand-navy">Your account is not set up yet.</h1>
        <p className="mt-3 text-sm text-brand-navySoft">Open the invitation link you were sent.</p>
        <Button className="mt-6 min-h-11 w-full" variant="outline" onClick={async () => {
          qc.clear();
          await supabase.auth.signOut();
          await navigate({ to: loginTo, replace: true });
        }}>Sign out</Button>
      </div>
    </div>
  );
}
