import { trackFunnel } from "@/lib/funnel-events";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitSlideshowApplication } from "@/lib/creator-apply.functions";
import { getSlideshowPayInfo } from "@/lib/slideshow-zones.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "./CountrySelect";
import { ApplyShell, Confirmation, FormSection, Honeypot, YesNo } from "./ApplyShell";
import { useI18n, useLocalePath } from "@/i18n";
import { CREATOR_FORMS } from "@/i18n/creator-forms";
import { isHttpUrl, isValidEmail } from "@/lib/creator-validation";
import { APPLICANT_LANGS, langOfCountry, type ApplicantLang } from "@/config/countries";

const LANG_NAMES: Record<ApplicantLang, string> = { fr: "Français", en: "English", es: "Español", it: "Italiano", pt: "Português", de: "Deutsch" };

export function SlideshowApplyPage() {
  const { lang } = useI18n();
  const privacyPath = useLocalePath("privacy");
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

  if (done) {
    return (
      <ApplyShell title={copy.title}>
        <Confirmation text={copy.confirmation} />
      </ApplyShell>
    );
  }

  return (
    <ApplyShell title={copy.title} lead={copy.lead}>
      <form data-funnel="apply" data-track="slideshow" onFocusCapture={(e) => { const f = e.currentTarget; if (!f.dataset["started"]) { f.dataset["started"] = "1"; trackFunnel("apply_started", { track: "slideshow" }); } }} onSubmit={onSubmit} className="relative mt-10 grid gap-8 rounded-2xl border border-brand-line bg-card p-6" noValidate>
        <Honeypot value={honey} onChange={setHoney} />
        <FormSection title={copy.about}>
          <div className="space-y-2">
            <Label htmlFor="full_name">{common.fullName}</Label>
            <Input id="full_name" className="h-11" autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{common.email}</Label>
            <Input id="email" type="email" className="h-11" autoComplete="email" aria-describedby="email-help" value={f.email} onChange={(e) => set("email", e.target.value)} />
            <p id="email-help" className="text-xs text-brand-navySoft">{lang === "fr" ? "Exemple : nom@exemple.com" : "Example: name@example.com"}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{common.country}</Label>
            <CountrySelect id="country" value={f.country} onChange={(v) => set("country", v)} lang={lang} labels={{ select: common.selectCountry, search: common.searchCountry, empty: common.noCountry }} />
            {countryPay ? (
              <p className="text-sm font-semibold text-brand-navy">{copy.countryPay(countryPay.weekly, countryPay.first)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adult">{copy.adult}</Label>
            <YesNo id="adult" value={adult} onChange={setAdult} yes={common.yes} no={common.no} />
            {adult === "no" ? (
              <p role="alert" className="text-sm font-semibold text-portal-red">
                {copy.underage}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="langue">{copy.language}</Label>
            <select id="langue" value={langue ?? autoLang} onChange={(e) => setLangue(e.target.value as ApplicantLang)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
              {APPLICANT_LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
            </select>
          </div>
        </FormSection>
        <FormSection title={common.consent}>
          <label className="flex items-start gap-3 text-sm text-brand-navy">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span>
              {common.consentText}{" "}
              <Link to={privacyPath} className="underline underline-offset-4">
                {common.privacy}
              </Link>
            </span>
          </label>
        </FormSection>
        {error ? (
          <p role="alert" className="text-sm font-semibold text-portal-red">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" variant="pill" size="pill" disabled={busy || adult === "no"}>
            {busy ? common.sending : common.submit}
          </Button>
        </div>
      </form>
    </ApplyShell>
  );
}
