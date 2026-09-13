import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvite } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banner, PortalCard } from "./ui";

export function InvitePage({ token }: { token: string }) {
  const navigate = useNavigate();
  const accept = useServerFn(acceptInvite);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"checking" | "signed-out" | "linking" | "error">("checking");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setState("signed-out");
        return;
      }
      setState("linking");
      try {
        await accept({ data: { token } });
        await navigate({ to: "/auteurs", replace: true });
      } catch {
        setState("error");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error("Incorrect email or password.");
      return;
    }
    window.location.reload();
  }

  async function magicLink() {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (error) {
      toast.error("The link could not be sent.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-portal-bg px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-center text-3xl font-extrabold text-brand-navy">Sophia author portal</h1>
        <p className="mt-2 text-center text-sm text-brand-navySoft">
          Sign in with the email address the editorial desk used to invite you.
        </p>

        <div className="mt-8">
          {state === "checking" || state === "linking" ? (
            <PortalCard>
              <p className="text-sm text-brand-navySoft">Linking your invitation…</p>
            </PortalCard>
          ) : state === "error" ? (
            <Banner tone="error" title="This invitation could not be linked">
              The link may have been used already, or your email address does not match the invitation. Contact the
              editorial desk on Upwork.
            </Banner>
          ) : (
            <PortalCard>
              <form onSubmit={signIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-password">Password</Label>
                  <Input id="invite-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
                </div>
                <Button type="submit" variant="pill" size="pillSm" className="w-full">
                  Sign in
                </Button>
              </form>
              <Button type="button" variant="ghost" size="pillSm" className="mt-3 w-full" onClick={magicLink}>
                Email me a sign-in link instead
              </Button>
              {sent ? <p className="mt-3 text-center text-sm text-brand-navySoft">Check your inbox for the link.</p> : null}
            </PortalCard>
          )}
        </div>
      </div>
    </div>
  );
}
