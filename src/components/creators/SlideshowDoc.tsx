import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/site/Logo";
import sophiaPlush from "@/assets/sophia-plush-cutout.png.asset.json";
import { ROUTES } from "@/i18n/routes";
import { SLIDESHOW_LANGUAGES, fillSlideshow, slideshowLanguage, slideshowPageFromPath, slideshowPath, slideshowStrings } from "@/i18n/slideshow-pages";
import { CONTACT_EMAIL } from "@/config/links";
import { useApps } from "@/lib/apps";
import { getSlideshowPayInfo } from "@/lib/slideshow-zones.functions";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "./CountrySelect";
import { slideshowApplyWithCountry, slideshowCountrySelection } from "@/lib/slideshow-country-selection";

/** Language of the current slideshow page (English outside these pages). */
export function useSlideshowLang() {
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const info = slideshowPageFromPath(pathname);
  const lang = info?.lang ?? slideshowLanguage("en");
  return { lang, page: info?.page ?? "landing", s: slideshowStrings(lang.code), pathname };
}

/** `?app=` from the URL (SSR-safe). */
export function useAppQuery(): string | undefined {
  const search = useRouterState({ select: (st) => st.location.search as Record<string, unknown> });
  const v = search["app"];
  return typeof v === "string" && v ? v : undefined;
}

/** Inline markup: **bold**, ==highlight== (highlight only for Sophia), nesting allowed. */
export function rich(text: string, mark: boolean): ReactNode {
  const parts = text.split(/(\*\*.+?\*\*|==.+?==)/g).filter((p) => p !== "");
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i} className="font-semibold">{rich(p.slice(2, -2), mark)}</strong>;
    if (p.startsWith("==") && p.endsWith("==") && p.length > 4) {
      const inner = rich(p.slice(2, -2), mark);
      return mark ? <mark key={i} className="rounded-[3px] bg-doc-highlight px-[2px] text-inherit">{inner}</mark> : <Fragment key={i}>{inner}</Fragment>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function DocLangMenu() {
  const { lang, page, s, pathname } = useSlideshowLang();
  const unswipe = pathname.includes("/unswipe/");
  const go = (urlCode: string) => {
    const q = new URLSearchParams(window.location.search);
    if (unswipe && !q.get("app")) q.set("app", "unswipe");
    const qs = q.toString();
    window.location.href = slideshowPath(urlCode, page) + (qs ? `?${qs}` : "");
  };
  return (
    <div className="absolute end-3 top-3 md:end-6 md:top-5">
      <select
        aria-label={s.footer.languageMenu}
        value={lang.urlCode}
        onChange={(e) => go(e.target.value)}
        className="h-8 max-w-[132px] cursor-pointer rounded-[6px] border border-doc-field bg-doc-paper px-2 text-[13px] font-medium text-doc-ink outline-none hover:bg-doc-hover focus:ring-[3px] focus:ring-doc-link/15"
      >
        {SLIDESHOW_LANGUAGES.map((l) => (
          <option key={l.code} value={l.urlCode} lang={l.htmlLang}>{l.nativeName}</option>
        ))}
      </select>
    </div>
  );
}

export function DocAvatar({ app }: { app?: string | undefined }) {
  const { data: apps = [] } = useApps();
  const a = app && app !== "sophia" ? apps.find((x) => x.slug === app) : undefined;
  if (!app || app === "sophia") {
    return <div className="h-16"><Logo className="h-16 gap-3 [&>svg:first-child]:h-16 [&>svg:last-child]:h-11" /></div>;
  }
  return (
    <div className="flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-doc-avatar text-doc-paper md:size-24">
      {a?.logo_path ? (
        <img src={a.logo_path} alt={a.name} className="size-full object-cover" />
      ) : a ? (
        <span className="text-[32px] font-bold md:text-[40px]">{a.name.charAt(0)}</span>
      ) : (
        <LogoMark className="doc-logo-white h-9 w-auto md:h-12" label="Sophia" />
      )}
    </div>
  );
}

export function DocShell({ children }: { children: ReactNode }) {
  const { lang, s: t } = useSlideshowLang();
  const fr = lang.code === "fr";
  const privacyPath = fr ? ROUTES.privacy.fr : ROUTES.privacy.en;
  const legalPath = fr ? ROUTES.legal.fr : ROUTES.legal.en;
  return (
    <div lang={lang.htmlLang} dir={lang.dir} className="relative flex min-h-screen flex-col overflow-x-hidden bg-doc-paper font-doc tracking-tight text-doc-ink antialiased">
      <DocLangMenu />
      <main className="mx-auto w-full max-w-[700px] flex-1 px-4 pb-16 pt-16 md:pt-16">{children}</main>
      <footer className="mx-auto w-full max-w-[700px] px-4 pb-8 text-[13px] text-doc-muted">
        © Vik Studios SAS ·{" "}
        <Link to={privacyPath} className="hover:underline">{t.footer.privacy}</Link> ·{" "}
        <Link to={legalPath} className="hover:underline">{t.footer.legal}</Link> ·{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
      </footer>
    </div>
  );
}

export const docLink = "text-doc-link underline decoration-doc-link/40 underline-offset-2 hover:decoration-doc-link";
export const docButton =
  "inline-flex h-9 items-center gap-1 rounded-[6px] bg-doc-button px-4 text-[15px] font-medium text-doc-paper transition-opacity hover:opacity-85 disabled:opacity-40";

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-doc tracking-tight text-xl font-semibold">{children}</h2>;
}
function Sec({ children }: { children: ReactNode }) {
  return <section className="space-y-4 border-t border-doc-line pt-7">{children}</section>;
}

export const withApp = (to: string, slug?: string) => (slug && slug !== "sophia" ? `${to}?app=${slug}` : to);

export function SlideshowDocLanding({ app: appProp }: { app?: string | undefined }) {
  const { lang, s } = useSlideshowLang();
  const t = s.landing;
  const queryApp = useAppQuery();
  const app = appProp ?? queryApp;
  const { data: apps = [] } = useApps();
  const a = app && app !== "sophia" ? apps.find((x) => x.slug === app) : undefined;
  const name = a?.name ?? "Sophia";
  const isSophia = !a;
  const [showPay, setShowPay] = useState(false);
  const [country, setCountry] = useState("");
  const [pay, setPay] = useState<{ weekly: number } | null>(null);
  const [payState, setPayState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const countryLocale = lang.code === "fr" ? "fr" : "en";
  useEffect(() => {
    const selected = slideshowCountrySelection(new URLSearchParams(window.location.search).get("country"), countryLocale);
    if (selected) { setCountry(selected); setShowPay(true); }
  }, []);
  useEffect(() => {
    if (!country) return;
    let live = true;
    setPay(null);
    setPayState("loading");
    getSlideshowPayInfo({ data: { country } }).then((result) => {
      if (!live) return;
      setPay(result.country);
      setPayState("ready");
    }).catch(() => { if (live) setPayState("error"); });
    return () => { live = false; };
  }, [country]);
  const vars = { name };
  const r = (text: string) => rich(fillSlideshow(text, vars), isSophia);
  const sep = lang.code === "fr" ? " : " : ": ";
  const about = isSophia
    ? t.aboutSophia
    : `${name}${a?.tagline ? ` (${a.tagline})` : ""}${a?.short_description ? `${sep}${a.short_description}` : ""} ${fillSlideshow(t.aboutOtherApp, vars)}`;
  const applyHref = slideshowApplyWithCountry(withApp(slideshowPath(lang.urlCode, "apply"), app), country);

  return (
    <DocShell>
      <DocAvatar app={app} />
      <div className="mt-6 flex items-center gap-3 md:gap-5">
        <h1 className="min-w-0 flex-1 font-doc tracking-tight text-[30px] font-bold leading-tight md:text-[40px]">{fillSlideshow(t.title, vars)}</h1>
        {isSophia ? <div className="doc-mascot"><img src={sophiaPlush.url} alt={t.mascotAlt} width={440} height={621} /></div> : null}
      </div>
      <div className="mt-6 space-y-4 text-[17px] leading-[1.6]">
        <p>{r(t.intro)}</p>
        <p>{r(t.pay)}</p>
        <Button type="button" variant="outline" aria-expanded={showPay} aria-controls="slideshow-pay" onClick={() => setShowPay((open) => !open)} className="h-auto min-h-10 whitespace-normal border-doc-field bg-doc-paper text-doc-ink shadow-none hover:bg-doc-hover">{t.viewPay}</Button>
        {showPay ? <div id="slideshow-pay" className="space-y-3 border-s-2 border-doc-line ps-4">
          <label htmlFor="pay-country" className="block font-semibold">{s.apply.country}</label>
          <div className="max-w-[360px] [&_button[role=combobox]]:border-doc-field [&_button[role=combobox]]:bg-doc-paper [&_button[role=combobox]]:text-doc-ink [&_button[role=combobox]]:shadow-none">
            <CountrySelect id="pay-country" value={country} onChange={setCountry} lang={countryLocale} displayLocale={lang.htmlLang} labels={{ select: s.apply.selectCountry, search: s.apply.searchCountry, empty: s.apply.noCountry }} />
          </div>
          <div aria-live="polite" aria-busy={payState === "loading"}>
            {payState === "loading" ? <p className="text-doc-muted">…</p> : pay ? <p>{rich(fillSlideshow(t.payResult, { weekly: pay.weekly }), isSophia)}</p> : payState === "ready" ? <p className="text-doc-muted">{t.payUnavailable}</p> : payState === "error" ? <p role="alert" className="text-doc-error">{s.apply.genericError}</p> : null}
          </div>
          <Button asChild className={`${docButton} h-auto min-h-10 whitespace-normal shadow-none hover:bg-doc-button`}><a href={applyHref}>{fillSlideshow(t.cta, vars)}</a></Button>
        </div> : null}
      </div>
      <div className="mt-7 space-y-7 text-[17px] leading-[1.6]">
        <Sec>
          <H2>{r(t.aboutTitle)}</H2>
          <p>{isSophia ? r(about) : about}</p>
        </Sec>
        <Sec>
          <H2>{r(t.doingTitle)}</H2>
          <p>{r(t.doing1)}</p>
          <p>{r(t.doing2)}</p>
          <p>{r(t.doing3)}</p>
        </Sec>
        <Sec>
          <H2>{r(t.whoTitle)}</H2>
          <p>{r(t.who1)}</p>
          <p>{r(t.criteriaIntro)}</p>
          <ul className="list-disc space-y-1 ps-6">{t.criteria.map((c) => <li key={c}>{r(c)}</li>)}</ul>
        </Sec>
        <Sec>
          <H2>{r(t.whyTitle)}</H2>
          {t.why.map((w) => <p key={w}>{r(w)}</p>)}
        </Sec>
        <div className="border-t border-doc-line pt-7">
          <p>{r(t.ctaLead)}</p>
          <a href={applyHref} className={`${docButton} mt-4`}>{fillSlideshow(t.cta, vars)}</a>
        </div>
      </div>
    </DocShell>
  );
}
