import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { DownloadCta } from "./DownloadCta";
import { LanguageToggle, useI18n, useLocalePath } from "@/i18n";

/**
 * En-tête sticky : fond clair, translucide + flou au scroll.
 * `bare` = sans lien de navigation (landing publicitaire).
 */
export function SiteHeader({ bare = false }: { bare?: boolean; overDark?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();
  const homePath = useLocalePath("home");
  const coursesPath = useLocalePath("courses");

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
          {!bare && (
            <Link
              to="/auth"
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 md:inline-flex"
            >
              {t.nav.teacherLogin}
            </Link>
          )}
          {!bare && (
            <Link
              to="/auth"
              className="hidden rounded-full border border-brand-line px-3 py-1.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 lg:inline-flex"
            >
              {t.nav.becomeTeacher}
            </Link>
          )}
          {!bare && (
            <Link
              to={coursesPath}
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 sm:inline-flex"
              activeProps={{ className: "underline underline-offset-4" }}
            >
              {t.courses.hubLink}
            </Link>
          )}
          <LanguageToggle />
          <DownloadCta variant="pillPink" size="pillSm">
            {t.nav.download}
          </DownloadCta>
        </div>
      </nav>
    </header>
  );
}
