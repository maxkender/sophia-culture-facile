import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

/** En-tête du site. `bare` = sans lien de navigation (landing publicitaire). */
export function SiteHeader({ bare = false }: { bare?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-line/70 bg-brand-surface/85 backdrop-blur">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3"
      >
        {bare ? (
          <Logo />
        ) : (
          <Link to="/" aria-label="Sophia — Culture générale, accueil" className="rounded-full">
            <Logo />
          </Link>
        )}
        <Button asChild variant="pill" size="pillSm">
          <Link to="/telecharger">Télécharger</Link>
        </Button>
      </nav>
    </header>
  );
}
