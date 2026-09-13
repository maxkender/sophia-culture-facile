import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error("Incorrect email address or password.");
      return;
    }
    await navigate({ to: "/auteurs", replace: true });
  }

  async function magicLink() {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auteurs` },
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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("The reset link could not be sent.");
      return;
    }
    setNotice("Check your inbox to reset your password.");
  }

  return (
    <AuthShell title="Author portal" intro="Sign in to write and review Sophia courses.">
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
      <button type="button" onClick={sendReset} disabled={loading} className="mt-3 w-full text-center text-sm font-semibold text-brand-navy underline-offset-4 hover:underline disabled:opacity-50">
        Forgot your password?
      </button>
      {notice ? <p className="mt-3 text-center text-sm text-brand-navySoft">{notice}</p> : null}
      <p className="mt-7 border-t border-brand-line pt-6 text-center text-sm text-brand-navySoft">
        Authors join by invitation from the Sophia editorial desk.
      </p>
    </AuthShell>
  );
}
