import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setValid(hash.get("type") === "recovery" || window.location.search.includes("type=recovery"));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour.");
    navigate({ to: "/espace-professeur", replace: true });
  }
  return <AuthShell title="Nouveau mot de passe" intro="Choisissez un nouveau mot de passe pour votre compte Sophia.">{valid ? <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="new-password">Nouveau mot de passe</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div><Button type="submit" variant="pillPink" size="pillSm" className="w-full">Enregistrer</Button></form> : <p className="text-sm text-brand-navySoft">Ouvrez cette page depuis le lien reçu par e-mail.</p>}</AuthShell>;
}