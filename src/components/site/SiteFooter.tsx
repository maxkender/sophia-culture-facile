import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { StoreButtons } from "./StoreButtons";
import { COMPANY, CONTACT_EMAIL } from "@/config/links";

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-line bg-brand-surface">
      <div className="mx-auto w-full max-w-5xl px-5 py-12">
        <Logo />
        <p className="mt-4 max-w-md text-sm text-brand-navySoft">
          Sophia — Culture générale est une application mobile d'apprentissage éditée par {COMPANY},
          société française.
        </p>

        <div className="mt-8 max-w-sm">
          <StoreButtons />
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-brand-navy">
          <li>
            <Link to="/mentions-legales" className="underline-offset-4 hover:underline">
              Mentions légales
            </Link>
          </li>
          <li>
            <Link to="/confidentialite" className="underline-offset-4 hover:underline">
              Confidentialité
            </Link>
          </li>
          <li>
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </li>
        </ul>

        <p className="mt-8 text-xs text-brand-navySoft">
          © {new Date().getFullYear()} {COMPANY}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
