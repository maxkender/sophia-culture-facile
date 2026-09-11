import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

export function WorkspaceHeader() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return <header className="border-b border-brand-line bg-brand-surface"><div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-5"><Link to="/" aria-label="Accueil Sophia"><Logo /></Link><div className="flex items-center gap-2"><Link to="/profil-enseignant" aria-label="Mon profil" title="Mon profil" className="inline-flex size-10 items-center justify-center rounded-full text-brand-navy hover:bg-brand-navy/5"><UserRound className="size-5" /></Link><Button type="button" variant="ghost" size="icon" title="Se déconnecter" aria-label="Se déconnecter" onClick={signOut}><LogOut className="size-5" /></Button></div></div></header>;
}