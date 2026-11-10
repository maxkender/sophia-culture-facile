import { useEffect, useState, type FormEvent } from "react";
import { Mail, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./AuthShell";
import { homeFor, resolveAccountRole } from "@/lib/account-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAuthLinks } from "@/lib/admin-auth-links";

export function AuthPage({ initialEmail = "", startWithReset = false }: { initialEmail?: string; startWithReset?: boolean } = {}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    startWithReset ? "Enter your email address below and we will send you a reset link." : null,
  );

  useEffect(() => {
    let active = true;
    async function routeSession() {
      const role = await resolveAccountRole();
      if (active && role !== null) window.location.assign(homeFor(role));
    }
    void routeSession();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setTimeout(() => { if (active) void routeSession(); }, 0);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error("Incorrect email address or password.");
      return;
    }
    const role = await resolveAccountRole();
    window.location.assign(role ? homeFor(role) : "/account-not-set-up");
  }

  async function magicLink() {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: adminAuthLinks(window.location.origin).signIn, shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      toast.error("The sign-in link could not be sent.");
      return;
    }
    setNotice("Check your inbox for a sign-in link.");
  }

  async function sendReset() {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: adminAuthLinks(window.location.origin).resetPassword,
    });
    setLoading(false);
    if (error) {
      toast.error("The reset link could not be sent.");
      return;
    }
    setNotice("Check your inbox to reset your password.");
  }

  return (
    <AuthShell title="Vik Studios Hub">
      <form onSubmit={signIn} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10" />
          </div>
        </div>
        <Button type="submit" variant="pillPink" size="pillSm" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button type="button" variant="ghost" size="pillSm" className="mt-3 w-full" disabled={loading} onClick={magicLink}>
        Email me a sign-in link
      </Button>
      <Button type="button" variant="ghost" onClick={sendReset} disabled={loading} className="mt-3 w-full text-center text-sm font-semibold text-brand-navy underline-offset-4 hover:underline disabled:opacity-50">
        Forgot your password?
      </Button>
      {notice ? <p className="mt-3 text-center text-sm text-brand-navySoft">{notice}</p> : null}
    </AuthShell>
  );
}
