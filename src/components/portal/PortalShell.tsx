import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { usePortalProfile } from "./usePortal";
import { Banner, PortalCard } from "./ui";

const AUTHOR_LINKS = [
  { to: "/auteurs", label: "Home" },
  { to: "/auteurs/guide", label: "Writing guide" },
  { to: "/auteurs/contract", label: "Agreement" },
  { to: "/auteurs/profile", label: "Your details" },
] as const;

const ADMIN_LINKS = [
  { to: "/auteurs/admin", label: "Dashboard" },
  { to: "/auteurs/admin/authors", label: "Authors" },
  { to: "/auteurs/admin/review", label: "Review queue" },
  { to: "/auteurs/admin/codes", label: "Access codes" },
  { to: "/auteurs/admin/documents", label: "Documents" },
  { to: "/auteurs/guide", label: "Writing guide" },
] as const;

export function PortalShell({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = usePortalProfile();
  const profile = data?.profile ?? null;
  const isAdmin = profile?.role === "admin";
  const links = isAdmin ? ADMIN_LINKS : AUTHOR_LINKS;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-portal-bg">
      <header className="border-b border-brand-line bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <Link to="/auteurs" aria-label="Sophia author portal">
            <Logo />
          </Link>
          <nav aria-label="Portal" className="order-last flex w-full flex-wrap items-center gap-1 md:order-none md:w-auto">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/auteurs" || link.to === "/auteurs/admin" }}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-brand-navySoft hover:bg-brand-navy/5 hover:text-brand-navy"
                activeProps={{
                  className: "rounded-full bg-portal-accent/10 px-3.5 py-2 text-sm font-semibold text-portal-accent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-brand-navySoft sm:inline">
              {profile?.full_name ?? data?.email ?? ""}
            </span>
            <Button type="button" variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={signOut}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {isLoading ? (
          <PortalCard>
            <p className="text-sm text-brand-navySoft">Loading…</p>
          </PortalCard>
        ) : !profile ? (
          <Banner tone="warning" title="This account is not linked to an author record">
            Ask the Sophia editorial desk for your invite link, then open it while signed in with this email address.
          </Banner>
        ) : adminOnly && !isAdmin ? (
          <Banner tone="error" title="Admin access only">
            This page is reserved for the editorial desk.
          </Banner>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
