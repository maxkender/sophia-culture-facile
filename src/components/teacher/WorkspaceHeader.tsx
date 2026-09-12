import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/espace-professeur", label: "Tableau de bord" },
  { to: "/mes-cours", label: "Mes cours à rédiger" },
  { to: "/contrat", label: "Contrat" },
  { to: "/paiements", label: "Paiements" },
] as const;

export function WorkspaceHeader() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
      setIsAdmin(data?.some((item) => item.role === "admin") ?? false);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-brand-line bg-brand-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-2">
        <Link to="/" aria-label="Accueil Sophia"><Logo /></Link>
        <nav className="order-last flex w-full flex-wrap items-center gap-1 md:order-none md:w-auto" aria-label="Espace professeur">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-navySoft hover:bg-brand-navy/5 hover:text-brand-navy"
              activeProps={{ className: "rounded-full bg-brand-navy/10 px-3 py-1.5 text-sm font-semibold text-brand-navy" }}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              to="/administration"
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-pink hover:bg-brand-pink/10"
              activeProps={{ className: "rounded-full bg-brand-pink/10 px-3 py-1.5 text-sm font-semibold text-brand-pink" }}
            >
              Administration
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/profil-enseignant" aria-label="Mon profil" title="Mon profil" className="inline-flex size-10 items-center justify-center rounded-full text-brand-navy hover:bg-brand-navy/5"><UserRound className="size-5" /></Link>
          <Button type="button" variant="ghost" size="icon" title="Se déconnecter" aria-label="Se déconnecter" onClick={signOut}><LogOut className="size-5" /></Button>
        </div>
      </div>
    </header>
  );
}
