import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { StoreButtons } from "./StoreButtons";
import { COMPANY, CONTACT_EMAIL } from "@/config/links";
import { LanguageToggle, fill, useI18n, useLocalePath } from "@/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  const legalPath = useLocalePath("legal");
  const privacyPath = useLocalePath("privacy");
  const creatorsPath = useLocalePath("creatorsSlideshow");

  return (
    <footer className="border-t border-brand-line bg-brand-surface">
      <div className="mx-auto w-full max-w-5xl px-5 py-12">
        <Logo />
        <p className="mt-4 max-w-md text-sm text-brand-navySoft">
          {fill(t.footer.tagline, { company: COMPANY })}
        </p>

        <div className="mt-8 max-w-sm">
          <StoreButtons />
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-brand-navy">
          <li>
            <Link to={creatorsPath} className="underline-offset-4 hover:underline">
              {t.nav.becomeCreator}
            </Link>
          </li>
          <li>
            <Link to={legalPath} className="underline-offset-4 hover:underline">
              {t.footer.legal}
            </Link>
          </li>
          <li>
            <Link to={privacyPath} className="underline-offset-4 hover:underline">
              {t.footer.privacy}
            </Link>
          </li>
          <li>
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </li>
          <li>
            <LanguageToggle />
          </li>
        </ul>

        <p className="mt-8 text-xs text-brand-navySoft">
          © {new Date().getFullYear()} {COMPANY}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
