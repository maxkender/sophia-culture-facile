import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CONTACT_EMAIL } from "@/config/links";
import { ROUTES } from "@/i18n/routes";
import { slideshowPath, slideshowStrings, findSlideshowLanguage, SLIDESHOW_LANGUAGES } from "@/i18n/slideshow-pages";
import homeCopy from "@/i18n/home-landing.json";
import { browserReferralCode, withReferralCode } from "@/lib/slideshow-referral-code";
import { withAttribution, type Attribution } from "@/lib/slideshow-attribution";
import { SlideshowMarketing, browserAttribution } from "@/components/creators/SlideshowMarketing";
import { docButton } from "@/components/creators/SlideshowDoc";

export type HomeCopy = { title: string; lead: string; cta: string; how: string; steps: string[] };
const COPY = homeCopy as Record<string, HomeCopy>;

/** Translated landing copy for a poster language code (all SLIDESHOW_LANGUAGES must have one; checked by test). */
export function homeLandingCopy(code: string): HomeCopy {
  const c = COPY[code];
  if (!c) throw new Error(`Missing home landing copy for ${code}`);
  return c;
}

const SITE = "https://sophia-culture.com";
/** /en and /fr keep their own routes; every other poster language lives at /{urlCode}. */
export const homePath = (urlCode: string) => `/${urlCode}`;

/** Head for a language version, with hreflang alternates between all languages. */
export function homeLandingHead(urlCode: string) {
  const l = findSlideshowLanguage(urlCode)!;
  const c = homeLandingCopy(l.code);
  const title = `Vik Studios — ${c.cta}`;
  return {
    meta: [
      { title },
      { name: "description", content: c.lead },
      { property: "og:title", content: title },
      { property: "og:description", content: c.lead },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: `${SITE}${homePath(l.urlCode)}` },
      ...SLIDESHOW_LANGUAGES.map((x) => ({ rel: "alternate", hrefLang: x.htmlLang, href: `${SITE}${homePath(x.urlCode)}` })),
      { rel: "alternate", hrefLang: "x-default", href: `${SITE}/` },
    ],
  };
}

/** Mini company landing at /, /en and /fr: one CTA to the poster page, keeping ?ref= and utm_*. */
export function HomeLanding({ lang }: { lang: string }) {
  const language = findSlideshowLanguage(lang)!;
  const t = homeLandingCopy(language.code);
  const footer = slideshowStrings(language.code).footer;
  const legalLang = lang === "fr" ? "fr" : "en";
  const target = slideshowPath(language.urlCode, "landing");
  // Before hydration the link already carries ?ref / utm_* / fbclid from the URL, so an early tap keeps them.
  const searchStr = useLocation({ select: (l) => l.searchStr });
  const kept = new URLSearchParams([...new URLSearchParams(searchStr)].filter(([k]) => k === "ref" || k === "fbclid" || k.startsWith("utm_")));
  const [href, setHref] = useState(kept.size ? `${target}?${kept}` : target);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const sync = () => {
      const attribution: Attribution = browserAttribution();
      setHref(withAttribution(withReferralCode(target, browserReferralCode()), attribution));
    };
    sync();
    setSearch(window.location.search);
    window.addEventListener("slideshow-consent", sync);
    return () => window.removeEventListener("slideshow-consent", sync);
  }, [target]);

  return (
    <div lang={language.htmlLang} dir={language.dir} className="relative flex min-h-dvh flex-col bg-doc-paper font-doc tracking-tight text-doc-ink antialiased">
      <select aria-label={footer.languageMenu} value={language.urlCode} onChange={(e) => { window.location.href = `${homePath(e.target.value)}${search}`; }} className="absolute end-3 top-3 rounded-[6px] border border-doc-field bg-doc-paper px-2 py-1 text-[13px] font-medium md:end-6 md:top-5">
        {SLIDESHOW_LANGUAGES.map((x) => <option key={x.urlCode} value={x.urlCode}>{x.nativeName}</option>)}
      </select>
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-5 py-16">
        <p className="text-[15px] font-semibold uppercase tracking-wide text-doc-muted">Vik Studios</p>
        <h1 className="mt-3 text-[32px] font-bold leading-tight md:text-[42px]">{t.title}</h1>
        <p className="mt-4 text-[17px] leading-[1.6]">{t.lead}</p>
        <a href={href} className={`${docButton} mt-7 h-11 w-full justify-center text-[16px] sm:w-auto sm:self-start`}>{t.cta}</a>
        <section className="mt-10 border-t border-doc-line pt-6">
          <h2 className="text-lg font-semibold">{t.how}</h2>
          <ol className="mt-3 space-y-2 text-[16px] leading-[1.5]">
            {t.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-doc-button text-[13px] font-semibold text-doc-paper">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="mx-auto w-full max-w-[560px] px-5 pb-6 text-[13px] text-doc-muted">
        © Vik Studios SAS · <Link to={ROUTES.privacy[legalLang]} className="hover:underline">{footer.privacy}</Link> ·{" "}
        <Link to={ROUTES.legal[legalLang]} className="hover:underline">{footer.legal}</Link> ·{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
      </footer>
      <SlideshowMarketing lang={language.code} />
    </div>
  );
}
