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

export function SlideshowApplyPage() {
  const { lang } = useI18n();
  const privacyPath = useLocalePath("privacy");
  const { common, slideshow: copy } = CREATOR_FORMS[lang];
  const submitFn = useServerFn(submitSlideshowApplication);
  const [f, setF] = useState({ full_name: "", email: "", phone: "", country: "", referral: "", upwork_url: "" });
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
    if (!f.full_name.trim() || !f.email.trim() || !f.phone.trim() || !f.country || !adult || !upwork) {
      setError(common.requiredError);
      return;
    }
    if (!consent) {
      setError(common.consentError);
      return;
    }
    setBusy(true);
    try {
      const res = await submitFn({
        data: {
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
            <Input id="email" type="email" className="h-11" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{common.phone}</Label>
            <Input id="phone" type="tel" className="h-11" placeholder="+33 6 12 34 56 78" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
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
            <Label htmlFor="referral">{copy.referral}</Label>
            <Textarea id="referral" rows={2} value={f.referral} onChange={(e) => set("referral", e.target.value)} />
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
