import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeacherSignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/profil-enseignant` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) return setSent(true);
    navigate({ to: "/profil-enseignant", replace: true });
  }

  return (
    <AuthShell title="Devenir professeur certifié" intro="Créez votre accès. Après confirmation de votre adresse, votre profil professionnel devra être complété avant toute contribution.">
      {sent ? (
        <div className="rounded-md bg-brand-pink/20 p-5 text-sm leading-relaxed text-brand-navy">
          <strong>Confirmez votre adresse e-mail.</strong><br />Le lien reçu vous conduira vers votre profil enseignant obligatoire.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="signup-email">Adresse e-mail</Label><Input id="signup-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="signup-password">Mot de passe</Label><Input id="signup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /><p className="text-xs text-muted-foreground">8 caractères minimum.</p></div>
          <Button type="submit" variant="pillPink" size="pillSm" className="w-full" disabled={loading}>{loading ? "Création…" : "Créer mon accès"}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-brand-navySoft">Déjà inscrit ? <Link to="/auth" className="font-bold text-brand-navy hover:underline">Se connecter</Link></p>
    </AuthShell>
  );
}