import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatorAgreementForm } from "@/components/creators/CreatorAgreementForm";
import { parseBlocks } from "@/lib/documents";
import { creatorAgreementBlocks } from "@/lib/creator-agreement";
import { applyToJob, getAgreementForJob } from "@/lib/hub.functions";
import { useI18n } from "@/i18n";
import { Shell } from "./CreatorsPages";

const SOPHIA = "00000000-0000-4000-8000-000000000001";
const JOB = "sophia-ugc-fr";

const COPY = {
  fr: {
    hero: "Deviens créateur UGC", go: "Postuler",
    pitch: {
      sophia: "Sophia, c'est la culture générale en 5 minutes par jour, à la place du scroll. En tant que créateur UGC, tu tournes de courtes vidéos à partir de nos briefs pour faire découvrir l'app. On étudie chaque candidature et on revient vers toi.",
      unswipe: "UnSwipe garde tes réseaux sociaux sans les Reels ni le fil « Pour toi », pour passer moins de temps sur ton écran. En tant que créateur UGC, tu tournes de courtes vidéos à partir de nos briefs pour faire découvrir l'app. On étudie chaque candidature et on revient vers toi.",
    },
    form: "Ta candidature", first: "Prénom", email: "Email", country: "Pays (2 lettres)", adult: "J'ai 18 ans ou plus", phone: "Mon téléphone", tiktok: "Ton TikTok perso (optionnel)",
    signLead: "Dernière étape : lis et signe le contrat.", back: "← Retour", done: "Candidature envoyée", doneText: "Ton contrat est signé. Regarde tes emails : le lien te permet de créer ton mot de passe.",
    errName: "Écris ton prénom.", errEmail: "Cette adresse email ne semble pas correcte. Vérifie la faute de frappe, ex. prenom@gmail.com.", errAdult: "Tu dois avoir 18 ans ou plus.", errCountry: "Indique ton pays en 2 lettres, ex. FR.", errGeneric: "La candidature n'a pas pu être envoyée. Vérifie tes infos et réessaie.",
  },
  en: {
    hero: "Become a UGC creator", go: "Apply",
    pitch: {
      sophia: "Sophia is general knowledge in 5 minutes a day, instead of scrolling. As a UGC creator, you film short videos from our briefs to introduce people to the app. We review every application and get back to you.",
      unswipe: "UnSwipe keeps your social apps without Reels or the For You feed, so you spend less time on your screen. As a UGC creator, you film short videos from our briefs to introduce people to the app. We review every application and get back to you.",
    },
    form: "Your application", first: "First name", email: "Email", country: "Country (2 letters)", adult: "I am 18 or older", phone: "My phone", tiktok: "Your personal TikTok (optional)",
    signLead: "Last step: read and sign the agreement.", back: "← Back", done: "Application sent", doneText: "Your agreement is signed. Check your email: the link lets you create your password.",
    errName: "Please enter your first name.", errEmail: "This email address doesn't look right. Check for a typo, e.g. name@gmail.com.", errAdult: "You need to be 18 or older.", errCountry: "Enter your country as 2 letters, e.g. GB.", errGeneric: "Your application could not be sent. Please check your details and try again.",
  },
} as const;

const BRANDS = {
  sophia: { id: SOPHIA, job: JOB, name: "Sophia", tagline: null as string | null },
  unswipe: { id: "00000000-0000-4000-8000-000000000002", job: "unswipe-ugc-fr", name: "UnSwipe", tagline: "Instagram without the Reels" },
};

export function UgcEarnPage({ app }: { app?: "unswipe" } = {}) {
  const { lang } = useI18n();
  const brand = BRANDS[app ?? "sophia"];
  const base = COPY[lang === "fr" ? "fr" : "en"];
  const t = base;
  const apply = useServerFn(applyToJob);
  const agreementFn = useServerFn(getAgreementForJob);
  const { data: agreement } = useQuery({ queryKey: ["job-agreement"], queryFn: () => agreementFn() });
  const [f, setF] = useState({ first: "", email: "", country: lang === "fr" ? "FR" : "", adult: false, device: "ios" as "ios" | "android", tiktok: "", website: "" });
  const [meta, setMeta] = useState({ src: "", ref: "" });
  const [step, setStep] = useState<"form" | "sign" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const p = new URLSearchParams(window.location.search); setMeta({ src: (p.get("src") ?? "").slice(0, 60), ref: (p.get("ref") ?? "").replace(/[^A-Za-z0-9._@]/g, "").slice(0, 40) }); }, []);

  function check() {
    if (f.first.trim().length < 2) return t.errName;
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return t.errEmail;
    if (!/^[A-Za-z]{2}$/.test(f.country.trim())) return t.errCountry;
    if (!f.adult) return t.errAdult;
    return null;
  }
  async function submit(signedName: string) {
    setBusy(true); setError(null);
    try {
      const r = await apply({ data: { slug: brand.job, fullName: f.first.trim(), email: f.email.trim(), country: f.country.trim().toUpperCase(), age: 18, tiktok: f.tiktok || undefined, answers: {}, signedName, documentVersion: agreement?.version, origin: window.location.origin, userAgent: navigator.userAgent, website: f.website || undefined, quick: true, device: f.device, src: meta.src || undefined, ref: meta.ref || undefined } as never });
      if (!r.ok) { setError(r.reason); setStep("form"); return; }
      setStep("done");
    } catch { setError(t.errGeneric); setStep("form"); } finally { setBusy(false); }
  }
  const input = "mt-1 block min-h-12 w-full rounded-xl border border-input bg-card px-3 text-[15px]";

  return (
    <Shell>
      {brand.tagline && <p className="bg-brand-navy px-4 py-2 text-center text-sm font-bold text-card">{brand.name} · {brand.tagline}</p>}
      <section className="mx-auto w-full max-w-3xl px-5 pb-8 pt-10 text-center sm:pt-16">
        <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-brand-navy sm:text-[64px]">{t.hero}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-navySoft">{t.pitch[app ?? "sophia"]}</p>
      </section>

      <section id="join" className="mx-auto w-full max-w-xl scroll-mt-24 px-5 pb-12">
        {step === "done" ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-card"><CheckCircle2 className="mx-auto size-10 text-portal-green" /><p className="mt-3 text-2xl font-extrabold text-brand-navy">{t.done}</p><p className="mt-2 text-brand-navySoft">{t.doneText}</p></div>
        ) : step === "sign" && agreement ? (
          <div className="space-y-3">
            <p className="text-brand-navySoft">{t.signLead}</p>
            <CreatorAgreementForm title={agreement.title} version={agreement.version} blocks={creatorAgreementBlocks(parseBlocks(agreement.body), "ugc")} merge={{ name: f.first } as never} onSign={(name) => submit(name)} />
            {busy ? <p className="text-sm text-brand-navySoft">…</p> : null}
            <Button variant="ghost" onClick={() => setStep("form")}>{t.back}</Button>
          </div>
        ) : (
          <form noValidate className="space-y-4 rounded-3xl bg-card p-6 shadow-card" onSubmit={(e) => { e.preventDefault(); const err = check(); setError(err); if (!err && agreement) setStep("sign"); }}>
            <h2 className="text-2xl font-extrabold text-brand-navy">{t.form}</h2>
            <input type="text" name="website" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-brand-navy">{t.first}<input className={input} value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} autoComplete="given-name" /></label>
              <label className="block text-sm font-semibold text-brand-navy">{t.email}<input type="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
              <label className="block text-sm font-semibold text-brand-navy">{t.country}<input className={input} maxLength={2} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value.toUpperCase() })} /></label>
              <label className="block text-sm font-semibold text-brand-navy">{t.tiktok}<input className={input} value={f.tiktok} onChange={(e) => setF({ ...f, tiktok: e.target.value })} placeholder="@" /></label>
            </div>
            <fieldset><legend className="text-sm font-semibold text-brand-navy">{t.phone}</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">{(["ios", "android"] as const).map((d) => <button key={d} type="button" onClick={() => setF({ ...f, device: d })} className={`min-h-12 rounded-xl border text-sm font-bold ${f.device === d ? "border-brand-navy bg-brand-navy text-brand-onNavy" : "border-input bg-card text-brand-navy"}`}>{d === "ios" ? "iPhone" : "Android"}</button>)}</div>
            </fieldset>
            <label className="flex items-center gap-3 text-[15px] font-semibold text-brand-navy"><input type="checkbox" className="size-5" checked={f.adult} onChange={(e) => setF({ ...f, adult: e.target.checked })} />{t.adult}</label>
            {error ? <p role="alert" className="rounded-xl bg-portal-red/10 p-3 text-sm text-portal-red">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full bg-brand-navy" disabled={!agreement}>{t.go}</Button>
          </form>
        )}
      </section>

    </Shell>
  );
}
