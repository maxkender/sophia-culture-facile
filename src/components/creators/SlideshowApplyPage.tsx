import { trackFunnel } from "@/lib/funnel-events";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitSlideshowApplication } from "@/lib/creator-apply.functions";
import { getSlideshowPayInfo } from "@/lib/slideshow-zones.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelect } from "./CountrySelect";
import { Honeypot } from "./ApplyShell";
import { DocAvatar, DocShell, docButton, docLink, rich, useSlideshowLang, withApp } from "./SlideshowDoc";
import { CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/i18n/routes";
import { fillSlideshow, slideshowPath } from "@/i18n/slideshow-pages";
import { isHttpUrl, isValidEmail } from "@/lib/creator-validation";
import { APPLICANT_LANGS, langOfCountry, type ApplicantLang } from "@/config/countries";

const LANG_NAMES: Record<ApplicantLang, string> = { fr: "Français", en: "English", es: "Español", it: "Italiano", pt: "Português", de: "Deutsch" };

export function SlideshowApplyPage() {
  const { lang: pageLang, s: dict } = useSlideshowLang();
  const t = dict.apply;
  const lang: "fr" | "en" = pageLang.code === "fr" ? "fr" : "en";
  const privacyPath = lang === "fr" ? ROUTES.privacy.fr : ROUTES.privacy.en;
  const [appSlug, setAppSlug] = useState<string | null>(null);
  useEffect(() => setAppSlug(new URLSearchParams(window.location.search).get("app")), []);
  const submitFn = useServerFn(submitSlideshowApplication);
  const [f, setF] = useState({ full_name: "", email: "", country: "" });
  const [langue, setLangue] = useState<ApplicantLang | null>(null);
  const autoLang: ApplicantLang = f.country ? langOfCountry(f.country) : (APPLICANT_LANGS.find((l) => l === pageLang.code.slice(0, 2).toLowerCase()) ?? "en");
  const [adult, setAdult] = useState<"" | "yes" | "no">("");
  const [referred, setReferred] = useState<"" | "yes" | "no">("");
  const [referralName, setReferralName] = useState("");
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((c) => ({ ...c, [k]: v }));
  const [payRange, setPayRange] = useState<{ min: number; max: number } | null>(null);
  const [countryPay, setCountryPay] = useState<{ weekly: number; first: number } | null>(null);

  useEffect(() => {
    let live = true;
    getSlideshowPayInfo({ data: { country: f.country || undefined } }).then((r) => {
      if (!live) return;
      setPayRange(r.range);
      setCountryPay(r.country);
    }).catch(() => {});
    return () => { live = false; };
  }, [f.country]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (adult === "no") return;
    if (!f.full_name.trim() || !f.email.trim() || !f.country || !adult || !referred) {
      setError(t.requiredError);
      return;
    }
    if (referred === "yes" && !referralName.trim()) {
      setError(t.referralNameError);
      return;
    }
    if (!isValidEmail(f.email)) {
      setError(t.emailError);
      return;
    }
    if (!consent) {
      setError(t.consentError);
      return;
    }
    setBusy(true);
    try {
      const res = await submitFn({
        data: { app: new URLSearchParams(window.location.search).get("app") ?? undefined,
          website: honey,
          full_name: f.full_name,
          email: f.email,
          country: f.country,
          is_adult: true,
          consent: true,
          langue: langue ?? autoLang,
          referred: referred === "yes",
          ...(referred === "yes" ? { referral_name: referralName.trim().slice(0, 120) } : {}),
        },
      });
      if (!res.ok) {
        setError(
          res.reason === "rate"
            ? t.rateError
            : t.genericError,
        );
        return;
      }
      trackFunnel("apply_submitted", { track: "slideshow" });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  const name = "Sophia";
  const landing = appSlug && appSlug !== "sophia" && (pageLang.code === "fr" || pageLang.code === "en")
    ? `${lang === "fr" ? "/fr/createurs" : "/en/creators"}/${appSlug}/slideshow`
    : withApp(slideshowPath(pageLang.urlCode, "landing"), appSlug ?? undefined);
  const header = (
    <>
      <DocAvatar app={appSlug ?? undefined} />
      <a href={landing} className="mt-6 inline-block text-[14px] text-doc-muted hover:text-doc-ink">{t.back}</a>
      <h1 className="mt-2 font-doc tracking-tight text-[30px] font-bold leading-tight md:text-[40px]">{fillSlideshow(t.title, { name })}</h1>
    </>
  );
  const label = "block text-[16px] font-semibold";
  const req = <span aria-hidden="true" className="ms-1 text-doc-error">*</span>;
  const field = "h-9 w-full max-w-[360px] rounded-[6px] border border-doc-field bg-doc-paper px-3 text-[15px] outline-none focus:border-doc-link/50 focus:ring-[3px] focus:ring-doc-link/15";

  if (done) {
    return (
      <DocShell>
        {header}
        <p className="mt-6 flex items-start gap-2 border-t border-doc-line pt-6 text-[17px] font-semibold leading-[1.6]">
          <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0" /> {t.confirmation}
        </p>
      </DocShell>
    );
  }

  return (
    <DocShell>
      {header}
      <div className="mt-4 space-y-4 text-[17px] leading-[1.6]">
        <p>{t.lead}</p>
        {payRange ? <p>{rich(fillSlideshow(t.paidLine, payRange), false)}</p> : null}
      </div>
      <form data-funnel="apply" data-track="slideshow" onFocusCapture={(e) => { const f = e.currentTarget; if (!f.dataset["started"]) { f.dataset["started"] = "1"; trackFunnel("apply_started", { track: "slideshow" }); } }} onSubmit={onSubmit} className="relative mt-8 space-y-8 border-t border-doc-line pt-7" noValidate>
        <Honeypot value={honey} onChange={setHoney} />
        <h2 className="font-doc tracking-tight text-xl font-semibold">{t.aboutYou}</h2>
        <div className="space-y-2">
          <label htmlFor="full_name" className={label}>{t.fullName}{req}</label>
          <input id="full_name" className={field} autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className={label}>{t.email}{req}</label>
          <input id="email" type="email" className={field} autoComplete="email" aria-describedby="email-help" value={f.email} onChange={(e) => set("email", e.target.value)} />
          <p id="email-help" className="text-[13px] text-doc-muted">{t.emailExample}</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="country" className={label}>{t.country}{req}</label>
          <div className="max-w-[360px] [&_button[role=combobox]]:h-9 [&_button[role=combobox]]:rounded-[6px] [&_button[role=combobox]]:border-doc-field [&_button[role=combobox]]:bg-doc-paper [&_button[role=combobox]]:text-[15px] [&_button[role=combobox]]:text-doc-ink [&_button[role=combobox]]:shadow-none">
            <CountrySelect id="country" value={f.country} onChange={(v) => set("country", v)} lang={lang} displayLocale={pageLang.code === "fr" || pageLang.code === "en" ? undefined : pageLang.htmlLang} labels={{ select: t.selectCountry, search: t.searchCountry, empty: t.noCountry }} />
          </div>
          {countryPay ? <p className="text-[15px]">{rich(fillSlideshow(t.countryPay, countryPay), false)}</p> : null}
        </div>
        <div className="space-y-2">
          <p id="adult-label" className={label}>{t.adult}{req}</p>
          <Choices labelledBy="adult-label" value={adult} onChange={(v) => setAdult(v as "yes" | "no")} options={[{ v: "yes", l: t.yes }, { v: "no", l: t.no }]} />
          {adult === "no" ? <p role="alert" className="text-[15px] font-semibold text-doc-error">{t.underage}</p> : null}
        </div>
        <div className="space-y-2">
          <p id="referral-label" className={label}>{t.referralQuestion}{req}</p>
          <Choices labelledBy="referral-label" value={referred} onChange={(v) => { setReferred(v as "yes" | "no"); if (v === "no") setReferralName(""); }} options={[{ v: "yes", l: t.yes }, { v: "no", l: t.no }]} />
          <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${referred === "yes" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={referred !== "yes"}>
            <div className="overflow-hidden">
              <div className="space-y-2 pt-3">
                <label htmlFor="referral_name" className={label}>{t.referralName}{req}</label>
                <input id="referral_name" className={field} autoComplete="off" maxLength={120} tabIndex={referred === "yes" ? 0 : -1} value={referralName} onChange={(e) => setReferralName(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p id="langue-label" className={label}>{t.emailLanguage}{req}</p>
          <Choices labelledBy="langue-label" value={langue ?? autoLang} onChange={(v) => setLangue(v as ApplicantLang)} options={APPLICANT_LANGS.map((l) => ({ v: l, l: LANG_NAMES[l] }))} />
        </div>
        <div className="space-y-3 border-t border-doc-line pt-7">
          <h2 className="font-doc tracking-tight text-xl font-semibold">{t.consentTitle}</h2>
          <label className="flex items-start gap-3 text-[15px] leading-[1.6]">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1 rounded-[4px] border-doc-field" />
            <span>
              {t.consentText}{" "}
              <Link to={privacyPath} className={docLink}>{t.privacy}</Link>
            </span>
          </label>
        </div>
        {error ? <p role="alert" className="text-[15px] font-semibold text-doc-error">{error}</p> : null}
        <button type="submit" className={docButton} disabled={busy || adult === "no"}>
          {busy ? t.sending : t.submit}
        </button>
        <p className="text-[13px] text-doc-muted">
          {t.privacyNotice}{" "}
          <Link to={privacyPath} className={docLink}>{t.privacy}</Link>.
        </p>
      </form>
    </DocShell>
  );
}

const strip = (t: string) => t.replace(/\s*\*\s*$/, "");

function Choices({ labelledBy, value, onChange, options }: { labelledBy: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex max-w-[360px] flex-col gap-1.5">
      {options.map((o, i) => {
        const on = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.v)}
            className={`flex h-9 items-center gap-2.5 rounded-[6px] border px-2 text-start text-[15px] ${on ? "border-doc-ink bg-doc-hover" : "border-doc-field bg-doc-paper hover:bg-doc-hover"}`}
          >
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-[4px] border text-[11px] font-semibold ${on ? "border-doc-ink bg-doc-ink text-doc-paper" : "border-doc-field text-doc-muted"}`}>
              {String.fromCharCode(65 + i)}
            </span>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}
