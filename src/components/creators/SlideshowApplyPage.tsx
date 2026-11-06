import { trackFunnel } from "@/lib/funnel-events";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitSlideshowApplication } from "@/lib/creator-apply.functions";
import { getSlideshowPayInfo } from "@/lib/slideshow-zones.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelect } from "./CountrySelect";
import { Honeypot } from "./ApplyShell";
import { DocAvatar, DocShell, docButton, docLink } from "./SlideshowDoc";
import { CheckCircle2 } from "lucide-react";
import { useI18n, useLocalePath } from "@/i18n";
import { CREATOR_FORMS } from "@/i18n/creator-forms";
import { isHttpUrl, isValidEmail } from "@/lib/creator-validation";
import { APPLICANT_LANGS, langOfCountry, type ApplicantLang } from "@/config/countries";

const LANG_NAMES: Record<ApplicantLang, string> = { fr: "Français", en: "English", es: "Español", it: "Italiano", pt: "Português", de: "Deutsch" };

export function SlideshowApplyPage() {
  const { lang } = useI18n();
  const privacyPath = useLocalePath("privacy");
  const landingPath = useLocalePath("creatorsSlideshow");
  const [appSlug, setAppSlug] = useState<string | null>(null);
  useEffect(() => setAppSlug(new URLSearchParams(window.location.search).get("app")), []);
  const { common, slideshow: copy } = CREATOR_FORMS[lang];
  const submitFn = useServerFn(submitSlideshowApplication);
  const [f, setF] = useState({ full_name: "", email: "", country: "" });
  const [langue, setLangue] = useState<ApplicantLang | null>(null);
  const autoLang: ApplicantLang = f.country ? langOfCountry(f.country) : lang;
  const [adult, setAdult] = useState<"" | "yes" | "no">("");
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
    if (!f.full_name.trim() || !f.email.trim() || !f.country || !adult) {
      setError(common.requiredError);
      return;
    }
    if (!isValidEmail(f.email)) {
      setError(common.emailError);
      return;
    }
    if (!consent) {
      setError(common.consentError);
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
        },
      });
      if (!res.ok) {
        setError(
          res.reason === "rate"
            ? common.rateError
            : common.genericError,
        );
        return;
      }
      trackFunnel("apply_submitted", { track: "slideshow" });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(common.genericError);
    } finally {
      setBusy(false);
    }
  }

  const landing = appSlug && appSlug !== "sophia" ? `${lang === "fr" ? "/fr/createurs" : "/en/creators"}/${appSlug}/slideshow` : landingPath;
  const header = (
    <>
      <DocAvatar app={appSlug ?? undefined} />
      <a href={landing} className="mt-6 inline-block text-[14px] text-doc-muted hover:text-doc-ink">{lang === "fr" ? "← Retour" : "← Back"}</a>
      <h1 className="mt-2 font-doc tracking-tight text-[30px] font-bold leading-tight md:text-[40px]">{copy.title}</h1>
    </>
  );
  const label = "block text-[16px] font-semibold";
  const req = <span aria-hidden="true" className="ml-1 text-doc-error">*</span>;
  const field = "h-9 w-full max-w-[360px] rounded-[6px] border border-doc-field bg-doc-paper px-3 text-[15px] outline-none focus:border-doc-link/50 focus:ring-[3px] focus:ring-doc-link/15";

  if (done) {
    return (
      <DocShell>
        {header}
        <p className="mt-6 flex items-start gap-2 border-t border-doc-line pt-6 text-[17px] font-semibold leading-[1.6]">
          <CheckCircle2 aria-hidden="true" className="mt-1 size-5 shrink-0" /> {copy.confirmation}
        </p>
      </DocShell>
    );
  }

  return (
    <DocShell>
      {header}
      <div className="mt-4 space-y-4 text-[17px] leading-[1.6]">
        <p>{copy.lead}</p>
        {payRange ? <p>{copy.paidLine(payRange.min, payRange.max)}</p> : null}
      </div>
      <form data-funnel="apply" data-track="slideshow" onFocusCapture={(e) => { const f = e.currentTarget; if (!f.dataset["started"]) { f.dataset["started"] = "1"; trackFunnel("apply_started", { track: "slideshow" }); } }} onSubmit={onSubmit} className="relative mt-8 space-y-8 border-t border-doc-line pt-7" noValidate>
        <Honeypot value={honey} onChange={setHoney} />
        <h2 className="font-doc tracking-tight text-xl font-semibold">{copy.about}</h2>
        <div className="space-y-2">
          <label htmlFor="full_name" className={label}>{strip(common.fullName)}{req}</label>
          <input id="full_name" className={field} autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className={label}>{strip(common.email)}{req}</label>
          <input id="email" type="email" className={field} autoComplete="email" aria-describedby="email-help" value={f.email} onChange={(e) => set("email", e.target.value)} />
          <p id="email-help" className="text-[13px] text-doc-muted">{lang === "fr" ? "Exemple : nom@exemple.com" : "Example: name@example.com"}</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="country" className={label}>{strip(common.country)}{req}</label>
          <div className="max-w-[360px] [&_button[role=combobox]]:h-9 [&_button[role=combobox]]:rounded-[6px] [&_button[role=combobox]]:border-doc-field [&_button[role=combobox]]:bg-doc-paper [&_button[role=combobox]]:text-[15px] [&_button[role=combobox]]:text-doc-ink [&_button[role=combobox]]:shadow-none">
            <CountrySelect id="country" value={f.country} onChange={(v) => set("country", v)} lang={lang} labels={{ select: common.selectCountry, search: common.searchCountry, empty: common.noCountry }} />
          </div>
          {countryPay ? <p className="text-[15px]">{copy.countryPay(countryPay.weekly, countryPay.first)}</p> : null}
        </div>
        <div className="space-y-2">
          <p id="adult-label" className={label}>{strip(copy.adult)}{req}</p>
          <Choices labelledBy="adult-label" value={adult} onChange={(v) => setAdult(v as "yes" | "no")} options={[{ v: "yes", l: common.yes }, { v: "no", l: common.no }]} />
          {adult === "no" ? <p role="alert" className="text-[15px] font-semibold text-doc-error">{copy.underage}</p> : null}
        </div>
        <div className="space-y-2">
          <p id="langue-label" className={label}>{strip(copy.language)}{req}</p>
          <Choices labelledBy="langue-label" value={langue ?? autoLang} onChange={(v) => setLangue(v as ApplicantLang)} options={APPLICANT_LANGS.map((l) => ({ v: l, l: LANG_NAMES[l] }))} />
        </div>
        <div className="space-y-3 border-t border-doc-line pt-7">
          <h2 className="font-doc tracking-tight text-xl font-semibold">{strip(common.consent)}</h2>
          <label className="flex items-start gap-3 text-[15px] leading-[1.6]">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-1 rounded-[4px] border-doc-field" />
            <span>
              {common.consentText}{" "}
              <Link to={privacyPath} className={docLink}>{common.privacy}</Link>
            </span>
          </label>
        </div>
        {error ? <p role="alert" className="text-[15px] font-semibold text-doc-error">{error}</p> : null}
        <button type="submit" className={docButton} disabled={busy || adult === "no"}>
          {busy ? common.sending : `${common.submit.replace(/\s*→$/, "")} →`}
        </button>
        <p className="text-[13px] text-doc-muted">
          {common.privacyNotice}{" "}
          <Link to={privacyPath} className={docLink}>{common.privacy}</Link>.
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
            className={`flex h-9 items-center gap-2.5 rounded-[6px] border px-2 text-left text-[15px] ${on ? "border-doc-ink bg-doc-hover" : "border-doc-field bg-doc-paper hover:bg-doc-hover"}`}
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
