import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CONTACT_EMAIL } from "@/config/links";
import { ROUTES } from "@/i18n/routes";
import { slideshowPath } from "@/i18n/slideshow-pages";
import { browserReferralCode, withReferralCode } from "@/lib/slideshow-referral-code";
import { withAttribution, type Attribution } from "@/lib/slideshow-attribution";
import { SlideshowMarketing, browserAttribution } from "@/components/creators/SlideshowMarketing";
import { docButton } from "@/components/creators/SlideshowDoc";

type Lang = "en" | "fr";

const COPY = {
  en: {
    title: "Vik Studios builds apps people love.",
    lead: "We make Sophia, the general-knowledge app, and we work with creators all over the world.",
    cta: "Become a creator",
    how: "How it works",
    steps: ["Apply in a few minutes.", "Get your account and ready-made slideshows.", "Post 2 a day and get paid every Monday."],
    privacy: "Privacy",
    legal: "Legal notice",
    other: "Français",
  },
  fr: {
    title: "Vik Studios crée des apps qu'on adore.",
    lead: "Nous faisons Sophia, l'app de culture générale, et nous travaillons avec des créateurs du monde entier.",
    cta: "Devenir créateur",
    how: "Comment ça marche",
    steps: ["Postule en quelques minutes.", "Reçois ton compte et des slideshows prêts à poster.", "Poste 2 fois par jour et sois payé chaque lundi."],
    privacy: "Confidentialité",
    legal: "Mentions légales",
    other: "English",
  },
} as const;

/** Mini company landing at /, /en and /fr: one CTA to the poster page, keeping ?ref= and utm_*. */
export function HomeLanding({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const target = slideshowPath(lang, "landing");
  const [href, setHref] = useState(target);
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
  const otherLang: Lang = lang === "fr" ? "en" : "fr";

  return (
    <div lang={lang} className="relative flex min-h-dvh flex-col bg-doc-paper font-doc tracking-tight text-doc-ink antialiased">
      <a href={`/${otherLang}${search}`} className="absolute end-3 top-3 rounded-[6px] border border-doc-field px-2 py-1 text-[13px] font-medium hover:bg-doc-hover md:end-6 md:top-5">{t.other}</a>
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
        © Vik Studios SAS · <Link to={ROUTES.privacy[lang]} className="hover:underline">{t.privacy}</Link> ·{" "}
        <Link to={ROUTES.legal[lang]} className="hover:underline">{t.legal}</Link> ·{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
      </footer>
      <SlideshowMarketing lang={lang} />
    </div>
  );
}
