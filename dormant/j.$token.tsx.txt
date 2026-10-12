import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DocumentBody } from "@/components/portal/DocumentBody";
import { parseBlocks } from "@/lib/documents";
import { creatorAgreementBlocks } from "@/lib/creator-agreement";
import { enterFastLane, resolveFastLane } from "@/lib/fast-lane.functions";

export const Route = createFileRoute("/j/$token")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Ton espace créateur Sophia" }, { name: "description", content: "Ton lien personnel vers l'espace créateur Sophia." },
    { property: "og:title", content: "Ton espace créateur Sophia" }, { property: "og:description", content: "Lien personnel, à usage unique." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: FastLanePage,
});

const T = {
  fr: {
    hi: (n: string) => `Salut ${n}, ton espace Sophia est prêt.`, sub: "Tu as été validé·e, pas de formulaire.", pay: "Ta rémunération",
    perPost: "par post", rpm: "pour 1 000 vues", cap: "maximum par post", target: "posts / mois", fixed: "fixe par mois", bonus: "bonus de bienvenue",
    platforms: { tiktok: "TikTok", instagram: "Instagram", both: "TikTok + Instagram" } as Record<string, string>, platformsLabel: "plateformes",
    how: "Comment ça marche", steps: ["Ton compte est déjà créé pour toi.", "Tu crées tes comptes et tu postes selon les briefs.", "Tu es payé·e le 5 du mois suivant."],
    rules: "Les 8 règles", contract: "Lire le contrat", accept: "J'ai lu et j'accepte le contrat", name: "Ton nom complet", enter: "Entrer",
    expired: "Ce lien a expiré — écris-nous", expiredSub: "Ce lien a déjà servi ou n'est plus valable. Écris-nous et on t'en envoie un nouveau tout de suite.", write: "Écrire à l'équipe",
    already: "Tu as déjà un espace : connecte-toi.", login: "Se connecter", needName: "Écris ton nom complet.", needTick: "Coche la case pour accepter le contrat.",
    reload: "Le contrat vient d'être mis à jour. Recharge la page.", mismatch: "Cet email est déjà relié à un autre compte. Écris-nous.", fail: "Ça n'a pas marché. Réessaie dans un instant.",
  },
  en: {
    hi: (n: string) => `Hi ${n}, your Sophia space is ready.`, sub: "You were validated, no form.", pay: "Your pay",
    perPost: "per post", rpm: "per 1,000 views", cap: "max per post", target: "posts / month", fixed: "fixed per month", bonus: "welcome bonus",
    platforms: { tiktok: "TikTok", instagram: "Instagram", both: "TikTok + Instagram" } as Record<string, string>, platformsLabel: "platforms",
    how: "How it works", steps: ["Your account is already created for you.", "You create your accounts and post from the briefs.", "You get paid on the 5th of the next month."],
    rules: "The 8 rules", contract: "Read the agreement", accept: "I have read and accept the agreement", name: "Your full name", enter: "Enter",
    expired: "This link has expired — write to us", expiredSub: "This link was already used or is no longer valid. Write to us and we'll send a new one right away.", write: "Email the team",
    already: "You already have a space: sign in.", login: "Sign in", needName: "Type your full name.", needTick: "Tick the box to accept the agreement.",
    reload: "The agreement was just updated. Reload the page.", mismatch: "This email is already linked to another account. Write to us.", fail: "That didn't work. Try again in a moment.",
  },
};
const eur = (n: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} €`;

function FastLanePage() {
  const { token } = Route.useParams();
  const resolve = useServerFn(resolveFastLane);
  const enter = useServerFn(enterFastLane);
  const valid = /^[a-f0-9]{48}$/.test(token);
  const { data, isLoading } = useQuery({ queryKey: ["fast-lane", token], enabled: valid, queryFn: () => resolve({ data: token }), staleTime: Infinity, retry: false });
  const [ticked, setTicked] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => { if (data && "fullName" in data && data.fullName) setName(data.fullName); }, [data]);
  const lang = data?.language === "en" ? "en" : "fr";
  // Parsing the agreement is heavy: do it once, and let the signed name update it lazily so typing never lags.
  const agreementBody = data && "agreement" in data && data.agreement ? data.agreement.body : null;
  const blocks = useMemo(() => (agreementBody ? creatorAgreementBlocks(parseBlocks(agreementBody), "ugc") : []), [agreementBody]);
  const lazyName = useDeferredValue(name);
  const t = T[lang];

  if (valid && (isLoading || !data)) return <Shell><p className="text-sm text-brand-navySoft">…</p></Shell>;
  if (!valid || !data || data.state !== "ok" || !("pay" in data)) {
    const mail = `mailto:maximilien@vikstudios.com?subject=${encodeURIComponent(lang === "en" ? "My Sophia link expired" : "Mon lien Sophia a expiré")}&body=${encodeURIComponent(lang === "en" ? `Hi, my creator link has expired. Could you send me a new one? ${data?.firstName ?? ""}` : `Salut, mon lien créateur a expiré. Tu peux m'en renvoyer un ? ${data?.firstName ?? ""}`)}`;
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold text-brand-navy">{t.expired}</h1>
        <p className="mt-3 text-brand-navySoft">{t.expiredSub}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><a href={mail}>{t.write}</a></Button>
          {data?.state === "used" ? <Button asChild variant="outline"><a href="/creators/login">{t.login}</a></Button> : null}
        </div>
      </Shell>
    );
  }
  const p = data.pay;
  const figures: [string, string][] = p.fixedMonthly ? [
    [eur(p.fixedMonthly), lang === "en" ? `for ${p.postsPerMonth} videos a month` : `pour ${p.postsPerMonth} vidéos par mois`],
    [eur(p.rpm), t.rpm], ...(p.cap ? [[eur(p.cap), t.cap] as [string, string]] : []),
    ...(p.perPost ? [[eur(p.perPost), t.perPost] as [string, string]] : []),
    [t.platforms[p.platforms] ?? p.platforms, t.platformsLabel],
  ] : [
    [eur(p.perPost), t.perPost], [eur(p.rpm), t.rpm], [eur(p.cap), t.cap], [String(p.postsPerMonth), t.target],
    [t.platforms[p.platforms] ?? p.platforms, t.platformsLabel],
    ...(p.welcomeBonus ? [[eur(p.welcomeBonus), t.bonus] as [string, string]] : []),
  ];
  const ruleTitles = parseBlocks(data.rules).filter((b) => b.type === "heading").map((b) => (b as { text: string }).text);

  async function go() {
    if (!data || !("agreement" in data) || !data.agreement) return;
    if (!ticked) return void toast.error(t.needTick);
    if (name.trim().length < 2) return void toast.error(t.needName);
    const needEmail = "emailPending" in data && data.emailPending;
    if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return void toast.error(lang === "en" ? "Type a valid email, for example lea@gmail.com." : "Écris un email valide, par exemple lea@gmail.com.");
    setBusy(true);
    try {
      const r = await enter({ data: { token, signedName: name.trim(), accepted: true, ...(needEmail ? { email: email.trim().toLowerCase() } : {}), documentVersion: data.agreement.version, userAgent: navigator.userAgent } });
      if (!r.ok) { toast.error(r.state === "reload" ? t.reload : r.state === "mismatch" ? t.mismatch : t.expired); setBusy(false); return; }
      const { error } = await supabase.auth.verifyOtp({ token_hash: r.tokenHash, type: r.type as "magiclink" });
      if (error) { toast.error(t.fail); setBusy(false); return; }
      window.location.assign("/creators/app/account");
    } catch { toast.error(t.fail); setBusy(false); }
  }

  return (
    <Shell>
      <h1 className="text-3xl font-extrabold leading-tight text-brand-navy sm:text-4xl">{t.hi(data.firstName)}</h1>
      <p className="mt-2 text-lg text-brand-navySoft">{t.sub}</p>

      <section className="mt-8 rounded-3xl bg-brand-navy p-6 text-card">
        <h2 className="text-sm font-bold uppercase tracking-wide opacity-80">{t.pay}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {figures.map(([v, k]) => <div key={k}><p className="text-3xl font-extrabold">{v}</p><p className="text-sm opacity-80">{k}</p></div>)}
        </div>
        {p.fixedMonthly ? <p className="mt-4 text-xs opacity-80">{lang === "en" ? `Prorated if fewer than ${p.postsPerMonth} videos.` : `Au prorata si moins de ${p.postsPerMonth} vidéos.`}</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-extrabold text-brand-navy">{t.how}</h2>
        <ol className="mt-3 space-y-2">{t.steps.map((s, i) => <li key={s} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-portal-accent/10 text-sm font-bold text-portal-accent">{i + 1}</span><span className="pt-0.5 text-brand-navy">{s}</span></li>)}</ol>
      </section>

      {ruleTitles.length ? <section className="mt-8 rounded-2xl bg-card p-5 shadow-portal">
        <h2 className="text-lg font-extrabold text-brand-navy">{t.rules}</h2>
        <ul className="mt-2 space-y-1 text-sm text-brand-navy">{ruleTitles.map((r) => <li key={r}>{r}</li>)}</ul>
      </section> : null}

      {data.agreement ? <section className="mt-6 rounded-2xl bg-card p-5 shadow-portal">
        <details>
          <summary className="cursor-pointer text-lg font-extrabold text-brand-navy">{t.contract} · {data.agreement.title} (v{data.agreement.version})</summary>
          <div className="mt-4 max-h-[60vh] overflow-y-auto"><DocumentBody blocks={blocks} merge={{ name: lazyName } as never} /></div>
        </details>
        {data.emailPending ? <label className="mt-5 block text-sm font-semibold text-brand-navy">{lang === "en" ? "Your email" : "Ton email"}
          <Input type="email" required className="mt-1 min-h-11" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        </label> : null}
        <label className="mt-5 flex items-start gap-3 text-sm font-semibold text-brand-navy">
          <Checkbox checked={ticked} onCheckedChange={(v) => setTicked(v === true)} className="mt-0.5" aria-label={t.accept} />{t.accept}
        </label>
        <label className="mt-4 block text-sm font-semibold text-brand-navy">{t.name}
          <Input className="mt-1 min-h-11" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <Button className="mt-5 min-h-12 w-full text-base" disabled={busy} onClick={() => void go()}>{t.enter}</Button>
      </section> : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-portal-bg px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]"><div className="mx-auto max-w-xl">{children}</div></main>;
}
