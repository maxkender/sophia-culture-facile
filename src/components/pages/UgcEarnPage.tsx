import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Faq } from "@/components/site/Faq";
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
    hero: "Jusqu'à 150 € par vidéo", sub: "Payé aux vues. Sans plafond de gains. Tu postes, on paie le 5.", cta: "Commencer — 60 secondes",
    rules: ["Tu postes 20 vidéos par mois sur un compte TikTok/Instagram qu'on crée pour toi", "2 € par 1 000 vues, jusqu'à 150 € par vidéo, + 1 € par vidéo dès 20 vidéos/mois", "Aucune sélection : tu t'inscris, tu postes 3 vidéos en 72 h, tu es dedans"],
    board: "Top créateurs ce mois", boardEmpty: "Les premiers créateurs démarrent cette semaine", views: "vues", posts: "vidéos",
    tiers: "Les paliers", perPost: "Par vidéo", cpm: "Par 1 000 vues", cap: "Plafond par vidéo",
    form: "Inscris-toi en 60 secondes", first: "Prénom", email: "Email", country: "Pays (2 lettres)", adult: "J'ai 18 ans ou plus", phone: "Mon téléphone", tiktok: "Ton TikTok perso (optionnel)", go: "Continuer vers le contrat",
    signLead: "Dernière étape : signe le contrat et tu commences tout de suite.", back: "← Retour", done: "Tu es dedans !", doneText: "Ton contrat est signé. Regarde tes emails : le lien te permet de créer ton mot de passe et de commencer.",
    errName: "Écris ton prénom.", errEmail: "Cette adresse email ne semble pas correcte. Vérifie la faute de frappe, ex. prenom@gmail.com.", errAdult: "Tu dois avoir 18 ans ou plus.", errCountry: "Indique ton pays en 2 lettres, ex. FR.", errGeneric: "L'inscription n'a pas pu être envoyée. Vérifie tes infos et réessaie.",
    faqTitle: "Questions fréquentes",
    faq: [
      ["Je suis payé comment, et quand ?", "Le 5 de chaque mois, par virement via Stripe, pour les vidéos du mois précédent : 2 € par 1 000 vues (jusqu'à 150 € par vidéo), plus 1 € par vidéo dès 20 vidéos dans le mois. Minimum 20 € ; en dessous, c'est reporté."],
      ["Il me faut des abonnés ?", "Non. On crée le compte pour toi, il démarre à zéro. Ce qui compte, ce sont les vues de chaque vidéo."],
      ["À qui appartient le compte ?", "À Sophia. Tu le gères et tu choisis le nom. Si tu arrêtes, le compte reste à Sophia et tu gardes tout ce que tu as gagné."],
      ["Je poste quoi ?", "Des vidéos face caméra de 20 à 40 secondes. On te donne chaque semaine des briefs avec des hooks et des scripts tirés des cours Sophia, tu les dis avec tes mots."],
      ["Je peux arrêter ?", "Oui, quand tu veux. Tu es payé pour tout ce qui a été posté et validé."],
      ["C'est légal, c'est déclaré ?", "Oui. Tu signes un contrat, chaque paiement est tracé. Tu déclares tes revenus selon ton statut (par exemple micro-entrepreneur en France)."],
    ],
  },
  en: {
    hero: "Up to €150 per video", sub: "Paid on views. No cap on earnings. You post, we pay on the 5th.", cta: "Start — 60 seconds",
    rules: ["You post 20 videos a month on a TikTok/Instagram account we create for you", "€2 per 1,000 views, up to €150 per video, + €1 per video once you reach 20 videos/month", "No selection: sign up, post 3 videos within 72 h, you're in"],
    board: "Top creators this month", boardEmpty: "The first creators start this week", views: "views", posts: "videos",
    tiers: "Tiers", perPost: "Per video", cpm: "Per 1,000 views", cap: "Cap per video",
    form: "Sign up in 60 seconds", first: "First name", email: "Email", country: "Country (2 letters)", adult: "I am 18 or older", phone: "My phone", tiktok: "Your personal TikTok (optional)", go: "Continue to the agreement",
    signLead: "Last step: sign the agreement and you start right away.", back: "← Back", done: "You're in!", doneText: "Your agreement is signed. Check your email: the link lets you create your password and get started.",
    errName: "Please enter your first name.", errEmail: "This email address doesn't look right. Check for a typo, e.g. name@gmail.com.", errAdult: "You need to be 18 or older.", errCountry: "Enter your country as 2 letters, e.g. GB.", errGeneric: "Your sign-up could not be sent. Please check your details and try again.",
    faqTitle: "Frequently asked questions",
    faq: [
      ["How and when am I paid?", "On the 5th of each month, by bank transfer through Stripe, for the previous month's videos: €2 per 1,000 views (up to €150 per video), plus €1 per video once you post 20 in the month. Minimum €20; below that it rolls over."],
      ["Do I need followers?", "No. We create the account for you and it starts from zero. What counts is the views on each video."],
      ["Who owns the account?", "Sophia does. You run it and choose the name. If you stop, the account stays with Sophia and you keep everything you earned."],
      ["What do I post?", "Face-to-camera videos of 20 to 40 seconds. Every week you get briefs with hooks and scripts drawn from Sophia courses; you say them in your own words."],
      ["Can I stop?", "Yes, whenever you want. You are paid for everything posted and approved."],
      ["Is it legal and declared?", "Yes. You sign an agreement and every payment is recorded. You declare the income according to your own tax status."],
    ],
  },
} as const;

const money = (n: number, lang: string) => new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

export function UgcEarnPage() {
  const { lang } = useI18n();
  const t = COPY[lang === "fr" ? "fr" : "en"];
  const apply = useServerFn(applyToJob);
  const agreementFn = useServerFn(getAgreementForJob);
  const { data: agreement } = useQuery({ queryKey: ["job-agreement"], queryFn: () => agreementFn() });
  const { data: tiers = [] } = useQuery({ queryKey: ["public-tiers"], queryFn: async () => (await supabase.from("ugc_tiers").select("tier, label, per_post, cpm, cap_per_post").eq("app_id", SOPHIA)).data ?? [] });
  const { data: board = [] } = useQuery({ queryKey: ["public-board"], queryFn: async () => ((await supabase.rpc("leaderboard_month", { _app: SOPHIA })).data ?? []) as { rank: number; pseudonym: string; earnings: number; views: number; posts: number }[] });
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
      const r = await apply({ data: { slug: JOB, fullName: f.first.trim(), email: f.email.trim(), country: f.country.trim().toUpperCase(), age: 18, tiktok: f.tiktok || undefined, answers: {}, signedName, documentVersion: agreement?.version, origin: window.location.origin, userAgent: navigator.userAgent, website: f.website || undefined, quick: true, device: f.device, src: meta.src || undefined, ref: meta.ref || undefined } as never });
      if (!r.ok) { setError(r.reason); setStep("form"); return; }
      setStep("done");
    } catch { setError(t.errGeneric); setStep("form"); } finally { setBusy(false); }
  }
  const input = "mt-1 block min-h-12 w-full rounded-xl border border-input bg-card px-3 text-[15px]";

  return (
    <Shell>
      <section className="mx-auto w-full max-w-3xl px-5 pb-8 pt-10 text-center sm:pt-16">
        <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight text-brand-navy sm:text-[64px]">{t.hero}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-navySoft">{t.sub}</p>
        <Button asChild variant="pill" size="pill" className="mt-7"><a href="#join">{t.cta}</a></Button>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-5 pb-10 md:grid-cols-3">
        {t.rules.map((r, i) => (
          <div key={r} className="rounded-3xl bg-card p-6 shadow-card">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-brand-onNavy">{i + 1}</span>
            <p className="mt-4 text-[17px] font-semibold leading-snug text-brand-navy">{r}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-5 pb-10 md:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-brand-navy"><Trophy className="size-5" />{t.board}</h2>
          {board.length === 0 ? <p className="mt-3 text-brand-navySoft">{t.boardEmpty}</p> : (
            <ol className="mt-4 space-y-2">{board.slice(0, 10).map((r) => (
              <li key={r.rank} className="flex items-center gap-3 text-[15px]"><span className="w-6 font-extrabold text-brand-navy">{r.rank}</span><span className="flex-1 font-semibold">{r.pseudonym}</span><span className="text-sm text-brand-navySoft">{Number(r.views).toLocaleString()} {t.views} · {r.posts} {t.posts}</span><b className="w-20 text-right text-brand-navy">{money(Number(r.earnings), lang)}</b></li>
            ))}</ol>
          )}
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="text-xl font-extrabold text-brand-navy">{t.tiers}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead><tr className="text-xs uppercase text-brand-navySoft"><th className="pb-2"> </th><th className="pb-2">{t.perPost}</th><th className="pb-2">{t.cpm}</th><th className="pb-2">{t.cap}</th></tr></thead>
              <tbody>{["trial", "active", "pro"].map((k) => { const r = tiers.find((x) => x.tier === k); return r ? <tr key={k} className="border-t border-brand-line"><td className="py-2 font-bold capitalize">{r.label ?? k}</td><td>{money(Number(r.per_post), lang)}</td><td>{money(Number(r.cpm), lang)}</td><td>{money(Number(r.cap_per_post), lang)}</td></tr> : null; })}</tbody>
            </table>
          </div>
        </div>
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

      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <h2 className="mb-4 text-2xl font-extrabold text-brand-navy">{t.faqTitle}</h2>
        <Faq items={t.faq.map(([question, answer]) => ({ question, answer }))} />
      </section>
    </Shell>
  );
}
