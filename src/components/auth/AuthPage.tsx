import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
  const [resetSent, setResetSent] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return toast.error("Adresse e-mail ou mot de passe incorrect.");
    navigate({ to: "/espace-professeur", replace: true });
  }

  async function sendReset() {
    if (!email.trim()) return toast.error("Saisissez d’abord votre adresse e-mail.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error("Impossible d’envoyer le lien pour le moment.");
    setResetSent(true);
  }

  return (
    <AuthShell title="Espace de contribution" intro="Connexion commune aux enseignants certifiés et à l’équipe de validation Sophia.">
      <form onSubmit={signIn} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <div className="relative">
            <Mail aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pl-10" />
          </div>
        </div>
        <Button type="submit" variant="pillPink" size="pillSm" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <button type="button" onClick={sendReset} disabled={loading} className="mt-4 w-full text-center text-sm font-semibold text-brand-navy underline-offset-4 hover:underline disabled:opacity-50">
        Mot de passe oublié ?
      </button>
      {resetSent ? <p className="mt-3 text-center text-sm text-brand-navySoft">Consultez votre boîte mail pour réinitialiser votre mot de passe.</p> : null}
      <div className="mt-7 border-t border-brand-line pt-6 text-center text-sm text-brand-navySoft">
        Vous souhaitez contribuer ?{" "}
        <Link to="/devenir-professeur" className="font-bold text-brand-navy underline-offset-4 hover:underline">Devenir professeur certifié</Link>
      </div>
    </AuthShell>
  );
}