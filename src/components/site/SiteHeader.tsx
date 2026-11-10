import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { LanguageToggle, useI18n, useLocalePath } from "@/i18n";

/**
 * En-tête sticky : fond clair, translucide + flou au scroll.
 * `bare` = sans lien de navigation (landing publicitaire).
 */
export function SiteHeader({ bare = false }: { bare?: boolean; overDark?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();
  const homePath = useLocalePath("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`safe-top sticky top-0 z-40 transition-colors duration-300 motion-reduce:transition-none ${
        scrolled
          ? "border-b border-brand-line/70 bg-brand-surface/80 backdrop-blur-xl"
          : "border-b border-transparent bg-brand-surface"
      }`}
    >
      <nav
        aria-label={t.nav.main}
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3"
      >
        {bare ? (
          <Logo />
        ) : (
          <Link to={homePath} aria-label={t.nav.home} className="rounded-full">
            <Logo />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <LanguageToggle />
        </div>
      </nav>
    </header>
  );
}
