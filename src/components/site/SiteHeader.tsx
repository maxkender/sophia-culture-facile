import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { DownloadCta } from "./DownloadCta";

/** En-tête sticky. `bare` = sans lien de navigation (landing publicitaire). */
export function SiteHeader({ bare = false }: { bare?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 motion-reduce:transition-none ${
        scrolled
          ? "border-b border-brand-line/70 bg-brand-surface/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3"
      >
        {bare ? (
          <Logo />
        ) : (
          <Link to="/" aria-label="Sophia — Culture générale, accueil" className="rounded-full">
            <Logo />
          </Link>
        )}
        <DownloadCta variant="pillPink" size="pillSm">
          Télécharger
        </DownloadCta>
      </nav>
    </header>
  );
}
