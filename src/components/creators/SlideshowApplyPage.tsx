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

export function SlideshowApplyPage() {
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
      setError("Please fill in every required field.");
      return;
    }
    if (!consent) {
      setError("Please tick the consent box.");
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
            ? "We have already received an application from you recently. We will be in touch."
            : "Something went wrong. Please try again in a moment.",
        );
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please check your answers and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <ApplyShell title="Apply as a slideshow creator">
        <Confirmation text="Thank you. We reply within five days by email." />
      </ApplyShell>
    );
  }

  return (
    <ApplyShell title="Apply as a slideshow creator" lead="One minute, no video needed.">
      <form onSubmit={onSubmit} className="relative mt-10 grid gap-8 rounded-2xl border border-brand-line bg-card p-6" noValidate>
        <Honeypot value={honey} onChange={setHoney} />
        <FormSection title="About you">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" className="h-11" autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" className="h-11" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number, with country code *</Label>
            <Input id="phone" type="tel" className="h-11" placeholder="+33 6 12 34 56 78" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Which country are you in? *</Label>
            <CountrySelect id="country" value={f.country} onChange={(v) => set("country", v)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adult">Are you at least 18? *</Label>
            <YesNo id="adult" value={adult} onChange={setAdult} />
            {adult === "no" ? (
              <p role="alert" className="text-sm font-semibold text-portal-red">
                You need to be at least 18 to apply.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="upwork">Do you have an Upwork account? *</Label>
            <YesNo id="upwork" value={upwork} onChange={setUpwork} />
            {upwork === "yes" ? (
              <Input type="url" className="h-11" aria-label="Upwork profile link" placeholder="Your Upwork profile link (optional)" value={f.upwork_url} onChange={(e) => set("upwork_url", e.target.value)} />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral">How did you hear about us?</Label>
            <Textarea id="referral" rows={2} value={f.referral} onChange={(e) => set("referral", e.target.value)} />
          </div>
        </FormSection>
        <FormSection title="Consent *">
          <label className="flex items-start gap-3 text-sm text-brand-navy">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
            <span>
              I agree that Sophia stores this application and contacts me about it.{" "}
              <Link to="/en/privacy" className="underline underline-offset-4">
                Privacy policy
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
            {busy ? "Sending…" : "Submit my application"}
          </Button>
        </div>
      </form>
    </ApplyShell>
  );
}
