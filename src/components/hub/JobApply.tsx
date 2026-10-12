import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorAgreementForm } from "@/components/creators/CreatorAgreementForm";
import { parseBlocks } from "@/lib/documents";
import { creatorAgreementBlocks } from "@/lib/creator-agreement";
import { applyToJob, getAgreementForJob } from "@/lib/hub.functions";

type Item = { type: "video" | "link" | "question" | "file"; label: string; required: boolean };
const input = "mt-1 block min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";
const label = "block text-sm font-semibold text-brand-navy";

export function JobApply({ slug, open, items, prefill, inviteToken }: { slug: string; open: boolean; items: Item[]; prefill?: { email: string; name: string } | undefined; inviteToken?: string | undefined }) {
  const apply = useServerFn(applyToJob);
  const agreementFn = useServerFn(getAgreementForJob);
  const { data: agreement } = useQuery({ queryKey: ["job-agreement"], enabled: false, queryFn: () => agreementFn() });
  const [f, setF] = useState({ fullName: prefill?.name ?? "", email: prefill?.email ?? "", phone: "", country: "FR", age: "", occupation: "", tiktok: "", instagram: "", videoUrl: "", website: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"form" | "sign" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  function check(): string | null {
    if (f.fullName.trim().length < 2) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return "This email address doesn't look right. Check for a typo, e.g. name@gmail.com.";
    const age = Number(f.age);
    if (!age || age < 18) return "You need to be 18 or older to apply.";
    for (const it of items) {
      if (!it.required) continue;
      if (it.type === "video" && !f.videoUrl.trim()) return `Please add a link to your video (${it.label}).`;
      if (it.type !== "video" && !answers[it.label]?.trim()) return `Please fill in: ${it.label}.`;
    }
    return null;
  }

  async function submit(signedName?: string) {
    setBusy(true); setError(null);
    try {
      const r = await apply({ data: {
        slug, fullName: f.fullName, email: f.email, phone: f.phone || undefined, country: f.country, age: Number(f.age), occupation: f.occupation || undefined,
        tiktok: f.tiktok || undefined, instagram: f.instagram || undefined, answers, videoUrl: f.videoUrl || undefined,
        signedName, documentVersion: agreement?.version, inviteToken, origin: window.location.origin, userAgent: navigator.userAgent, website: f.website || undefined,
      } as never });
      if (!r.ok) { setError(r.reason); setStep("form"); return; }
      setAccepted(r.accepted); setStep("done");
    } catch {
      setError("Something went wrong while sending your application. Please check your details and try again.");
    } finally { setBusy(false); }
  }

  if (step === "done") return (
    <div className="rounded-2xl bg-card p-6 text-center shadow-portal">
      <CheckCircle2 className="mx-auto size-10 text-portal-green" />
      <p className="mt-3 text-lg font-extrabold text-brand-navy">{accepted ? "You're in!" : "Application sent"}</p>
      <p className="mt-1 text-sm text-brand-navySoft">{accepted ? "Your agreement is signed. Check your email: the link inside lets you create your password and start onboarding." : "Application received, we'll get back to you."}</p>
    </div>
  );

  if (step === "sign" && agreement) return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navySoft">This is an open job: sign the agreement now and you start right away.</p>
      <CreatorAgreementForm title={agreement.title} version={agreement.version} blocks={creatorAgreementBlocks(parseBlocks(agreement.body), "ugc")} merge={{ name: f.fullName } as never} onSign={(name) => submit(name)} />
      {error ? <p role="alert" className="rounded-xl bg-portal-red/10 p-3 text-sm text-portal-red">{error}</p> : null}
      <Button variant="ghost" onClick={() => setStep("form")}>← Back to the form</Button>
    </div>
  );

  return (
    <form className="space-y-4 rounded-2xl bg-card p-5 shadow-portal" onSubmit={(e) => { e.preventDefault(); const err = check(); if (err) { setError(err); return; } void submit(); }} noValidate>
      <h2 className="text-lg font-extrabold text-brand-navy">Apply</h2>
      <input type="text" name="website" value={f.website} onChange={set("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Full name<input className={input} value={f.fullName} onChange={set("fullName")} autoComplete="name" /></label>
        <label className={label}>Email<input type="email" className={input} value={f.email} onChange={set("email")} autoComplete="email" /></label>
        <label className={label}>Country (2 letters)<input className={input} maxLength={2} value={f.country} onChange={set("country")} /></label>
        <label className={label}>Age<input type="number" min={18} className={input} value={f.age} onChange={set("age")} /></label>
        <label className={label}>Phone (optional)<input className={input} value={f.phone} onChange={set("phone")} placeholder="+33 6 12 34 56 78" /></label>
        <label className={label}>School or job (optional)<input className={input} value={f.occupation} onChange={set("occupation")} /></label>
        <label className={label}>TikTok (optional)<input className={input} value={f.tiktok} onChange={set("tiktok")} placeholder="@yourname" /></label>
        <label className={label}>Instagram (optional)<input className={input} value={f.instagram} onChange={set("instagram")} placeholder="@yourname" /></label>
      </div>
      {items.map((it) => it.type === "video" ? (
        <label key={it.label} className={label}>{it.label}{it.required ? " *" : ""}<input className={input} value={f.videoUrl} onChange={set("videoUrl")} placeholder="Link to your video (TikTok, Drive, YouTube…)" /></label>
      ) : (
        <label key={it.label} className={label}>{it.label}{it.required ? " *" : ""}
          {it.type === "question" ? <textarea className={`${input} min-h-20 py-2`} value={answers[it.label] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [it.label]: e.target.value }))} />
            : <input className={input} value={answers[it.label] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [it.label]: e.target.value }))} placeholder={it.type === "file" ? "Link to the file" : "https://"} />}
        </label>
      ))}
      {error ? <p role="alert" className="rounded-xl bg-portal-red/10 p-3 text-sm text-portal-red">{error}</p> : null}
      <Button type="submit" size="lg" disabled={busy} className="w-full bg-brand-navy">{busy ? "Sending…" : "Send my application"}</Button>
    </form>
  );
}
