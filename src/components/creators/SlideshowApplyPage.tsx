import { trackFunnel } from "@/lib/funnel-events";
import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitSlideshowApplication } from "@/lib/creator-apply.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [f, setF] = useState({ full_name: "", email: "", phone: "", country: "", referral: "", upwork_url: "", q_country_now: "", q_tiktok: "", q_previous: "" });
  const [phone2, setPhone2] = useState<"" | "yes" | "no">("");
  const [langue, setLangue] = useState<ApplicantLang | null>(null);
  const autoLang: ApplicantLang = f.country ? langOfCountry(f.country) : lang;
  const [adult, setAdult] = useState<"" | "yes" | "no">("");
  const [upwork, setUpwork] = useState<"" | "yes" | "no">("");
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((c) => ({ ...c, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (adult === "no") return;
    if (!f.full_name.trim() || !f.email.trim() || !f.country || !adult || !upwork || !phone2) {
      setError(common.requiredError);
      return;
    }
    if (!isValidEmail(f.email)) {
      setError(common.emailError);
      return;
    }
    if (upwork === "yes" && f.upwork_url.trim() && !isHttpUrl(f.upwork_url)) {
      setError(lang === "fr" ? "Saisissez un lien Upwork complet commençant par https://." : "Enter a complete Upwork link beginning with https://.");
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
          phone: f.phone,
          country: f.country,
          is_adult: true,
          has_upwork: upwork === "yes",
          upwork_profile_url: upwork === "yes" ? f.upwork_url : "",
          referral_source: f.referral,
          consent: true,
          deux_telephones: phone2 === "yes",
          langue: langue ?? autoLang,
          q_country_now: f.q_country_now,
          q_tiktok_daily: f.q_tiktok,
          q_previous_content: f.q_previous,
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
            <Label htmlFor="phone">{common.phone} <span className="font-normal text-brand-navySoft">{lang === "fr" ? "(facultatif)" : "(optional)"}</span></Label>
            <Input id="phone" type="tel" className="h-11" placeholder="+33 6 12 34 56 78" autoComplete="tel" aria-describedby="phone-help" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
            <p id="phone-help" className="text-xs text-brand-navySoft">{lang === "fr" ? "Incluez l’indicatif du pays, par exemple +33." : "Include the country code, for example +44."}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{common.country}</Label>
            <CountrySelect id="country" value={f.country} onChange={(v) => set("country", v)} lang={lang} labels={{ select: common.selectCountry, search: common.searchCountry, empty: common.noCountry }} />
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
            <Label htmlFor="upwork">{copy.upwork}</Label>
            <YesNo id="upwork" value={upwork} onChange={setUpwork} yes={common.yes} no={common.no} />
            {upwork === "yes" ? (
              <Input type="url" className="h-11" aria-label={copy.upworkLink} placeholder={copy.upworkLink} value={f.upwork_url} onChange={(e) => set("upwork_url", e.target.value)} />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone2">{copy.secondPhone}</Label>
            <YesNo id="phone2" value={phone2} onChange={setPhone2} yes={common.yes} no={common.no} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="langue">{copy.language}</Label>
            <select id="langue" value={langue ?? autoLang} onChange={(e) => setLangue(e.target.value as ApplicantLang)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
              {APPLICANT_LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral">{copy.referral}</Label>
            <Textarea id="referral" rows={2} value={f.referral} onChange={(e) => set("referral", e.target.value)} />
          </div>
        </FormSection>
        <FormSection title={copy.screening}>
          <div className="space-y-2">
            <Label htmlFor="q1">{copy.qCountryNow}</Label>
            <Input id="q1" className="h-11" value={f.q_country_now} onChange={(e) => set("q_country_now", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="q3">{copy.qTiktok}</Label>
            <Input id="q3" className="h-11" value={f.q_tiktok} onChange={(e) => set("q_tiktok", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="q4">{copy.qPrevious}</Label>
            <Textarea id="q4" rows={3} value={f.q_previous} onChange={(e) => set("q_previous", e.target.value)} />
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
