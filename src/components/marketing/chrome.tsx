import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { ROUTES } from "@/i18n/routes";
import { COMPANY, CONTACT_EMAIL, SMART_LINK } from "@/config/links";
import { fill } from "@/i18n";
import { Hot, scrollToId, useMk, useStartHref } from "./motion";

export type MkPage = "home" | "landing" | "download";

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 2.8v18.4c0 .5.5.8.9.6l10.6-9.8L4.9 2.2c-.4-.2-.9.1-.9.6z" fill="currentColor" opacity="0.9" />
      <path d="M15.5 12l3.2-3 2.6 1.5c.9.5.9 1.6 0 2.1l-2.6 1.5-3.2-2.1z" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

export function StoreBadges({ outline = false }: { outline?: boolean }) {
  const { c } = useMk();
  const cls = outline ? "mk-store mk-store-outline" : "mk-store";
  return (
    <div className="flex flex-wrap gap-3">
      <a href={SMART_LINK} className={cls} rel="noopener" aria-label={`${c.cta.appStoreSmall} ${c.cta.appStore}`}>
        <AppleIcon /><span><small>{c.cta.appStoreSmall}</small><b>{c.cta.appStore}</b></span>
      </a>
      <a href={SMART_LINK} className={cls} rel="noopener" aria-label={`${c.cta.googlePlaySmall} ${c.cta.googlePlay}`}>
        <PlayIcon /><span><small>{c.cta.googlePlaySmall}</small><b>{c.cta.googlePlay}</b></span>
      </a>
    </div>
  );
}

export function StartButton({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const { c } = useMk();
  const href = useStartHref();
  return <a href={href} className={`mk-btn ${light ? "mk-btn-light" : "mk-btn-primary"} ${className}`}>{c.cta.start}<span aria-hidden="true">→</span></a>;
}

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <img src="/onboarding/sophia_mark.png" alt="" width={30} height={30} className="size-[30px] rounded-[9px]" />
      <span className="text-[19px] font-extrabold tracking-tight">Sophia</span>
    </span>
  );
}

export function MkHeader({ page }: { page: MkPage }) {
  const { c, lang } = useMk();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const other = lang === "fr" ? "en" : "fr";
  const home = ROUTES.home[lang];
  const anchors = [
    { id: "how", label: c.nav.how },
    { id: "reviews", label: c.nav.reviews },
    { id: "faq", label: c.nav.faq },
  ];
  const go = (id: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (page === "home" && scrollToId(id)) e.preventDefault();
  };
  return (
    <>
      <header className="mk-header" data-scrolled={scrolled || open}>
        <div className="mk-wrap flex h-16 items-center gap-6 md:h-[72px]">
          <Link to={home} aria-label="Sophia"><Logo /></Link>
          <nav className="ml-6 hidden items-center gap-7 lg:flex" aria-label="Main">
            <Link to={ROUTES.courses[lang]} className="mk-navlink">{c.nav.courses}</Link>
            {anchors.map((a) => <a key={a.id} href={`${home}#${a.id}`} onClick={go(a.id)} className="mk-navlink">{a.label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to={ROUTES[page][other]} className="mk-navlink hidden rounded-full px-3 py-1.5 text-sm uppercase sm:inline-block" hrefLang={other}>{other}</Link>
            <a href={SMART_LINK} className="mk-btn mk-btn-primary mk-btn-sm hidden sm:inline-flex">{c.nav.download}</a>
            <button type="button" className="grid size-10 place-items-center rounded-full lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? c.nav.close : c.nav.menu} aria-expanded={open}>
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </header>
      {open ? (
        <div className="mk-menu lg:hidden" role="dialog" aria-modal="true">
          <div className="h-16" />
          <nav className="mt-6 flex flex-col">
            <Link to={ROUTES.courses[lang]} className="mk-menu-link" onClick={() => setOpen(false)}>{c.nav.courses}</Link>
            {anchors.map((a, i) => <a key={a.id} href={`${home}#${a.id}`} onClick={go(a.id)} className="mk-menu-link" style={{ animationDelay: `${(i + 1) * 60}ms` }}>{a.label}</a>)}
            <Link to={ROUTES[page][other]} className="mk-menu-link uppercase" style={{ animationDelay: "240ms" }}>{other === "fr" ? "Français" : "English"}</Link>
          </nav>
          <div className="mt-auto space-y-4 pb-[env(safe-area-inset-bottom)]">
            <StartButton className="w-full" />
            <StoreBadges outline />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MkFooter({ page }: { page: MkPage }) {
  const { c, lang } = useMk();
  const f = c.footer;
  const startHref = useStartHref();
  const cols = [
    { title: f.product, links: [
      { to: ROUTES.courses[lang], label: f.courses },
      { to: ROUTES.landing[lang], label: f.app },
      { to: ROUTES.download[lang], label: f.download },
      { href: startHref, label: f.start },
    ] },
    { title: f.company, links: [
      { to: "/auth", label: f.teacherLogin },
      { to: ROUTES.apply[lang], label: f.becomeTeacher },
      { to: ROUTES.creatorsUgc[lang], label: f.becomeCreator },
      { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL },
    ] },
    { title: f.legalTitle, links: [
      { to: ROUTES.legal[lang], label: f.legal },
      { to: ROUTES.privacy[lang], label: f.privacy },
    ] },
  ];
  return (
    <footer className="border-t border-[color:var(--ob-line)] bg-[color:var(--ob-surface)]">
      <div className="mk-wrap py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mk-ink2 mt-4 max-w-xs text-sm">{fill(f.tagline, { company: COMPANY })}</p>
            <div className="mt-6"><StoreBadges /></div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="mk-ink3 text-xs font-bold uppercase tracking-wider">{col.title}</p>
              <ul className="mt-4 space-y-3 text-[15px] font-semibold">
                {col.links.map((l) => (
                  <li key={l.label}>{"to" in l && l.to ? <Link to={l.to} className="hover:text-[color:var(--ob-blue)]">{l.label}</Link> : <a href={(l as { href: string }).href} className="hover:text-[color:var(--ob-blue)]">{l.label}</a>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mk-ink3 mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--ob-line)] pt-6 text-sm">
          <span>© {new Date().getFullYear()} {COMPANY}. {f.rights}</span>
          <span className="flex items-center gap-3">
            {f.language}:
            <Link to={ROUTES[page].fr} hrefLang="fr" className={lang === "fr" ? "font-bold text-[color:var(--ob-ink)]" : ""}>Français</Link>
            <Link to={ROUTES[page].en} hrefLang="en" className={lang === "en" ? "font-bold text-[color:var(--ob-ink)]" : ""}>English</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export { Hot };
